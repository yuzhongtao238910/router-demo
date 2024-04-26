import { createWebHashHistory } from "./history/hash.js"
import { createWebHistory } from "./history/history.js"
import {reactive, ref, shallowRef, computed, unref, provide} from "vue";
import {RouterLink} from "./router-link.js"
import { RouterView } from "./router-view.js"
import { createRouterMatcher } from "./matcher/index.js"
// 拍平路由的数据处理，options.routes是用户的配置，难以理解，不好维护，使用的时候也不方便
/*
/ => record {Home}

/a => record {A, parent: Home}

/b => record {B, parent: Home}

/about => record {About}


当用户访问： /a 的时候，找到/a对应的记录 会渲染home和a

如果home里面还有parent的话，就是先渲染home的parent，在渲染home，最后渲染a

 */


const START_LOCATION_NORMALIZED = { // 初始化路由系统之中的默认参数
    path: '/',
    // params: {}, // 路径参数
    // query: {},
    matched: [], // 当前路径匹配到的记录
}
function useCallback() {
    const handlers = []

    function add(handler) {
        handlers.push(handler)
    }

    return {
        add,
        list: () => handlers
    }
}
function extractChangeRecords(to, from) {
    const leavingRecords = []
    const updatingRecords = []
    const enteringRecords = []

    console.log(to, from , 48)

    // /a/b => /a/b/c
    // /a/b/c => /a/b

    const len = Math.max(to.matched.length, from.matched.length)

    for (let i = 0; i < len; i++) {
        // /a   /b/c
        const recordFrom = from.matched[i]
        if (recordFrom) {
            // 去的有 来的也有 那么就是更新的操作
            if (to.matched.find(record => record.path == recordFrom.path)) {
                updatingRecords.push(recordFrom)
            } else {
                // 去的有，来的没有 /a/b/c /a/b/d
                leavingRecords.push(recordFrom)
            }
        }


        const recordTo = to.matched[i]
        if (recordTo) {
            // /a/b /a/b/c
            if (!from.matched.find(record => record.path === recordTo.path)) {
                enteringRecords.push(recordTo)
            }
        }
    }


    return [leavingRecords,
        updatingRecords,
        enteringRecords
    ]



}

function guardToPromise(guard, to, from, record) {
    return () => new Promise((resolve, reject) => {
        const next = () => resolve()
        let guardReturn = guard.call(record, to, from, next)

        // 如果不调用next 最终也会调用next 用户可以不调用next
        return Promise.resolve(guardReturn).then(next)
    })
}

function extractComponentsGuards(matched, guardType, to, from) {
    const guards = []

    for (const record of matched) {
        // 获取当前的组件
        let rawComponent = record.components.default
        // 拿到beforeRouteLeave
        const guard = rawComponent[guardType]

        // 我需要将钩子全部串联在一起
        guard && guards.push(guardToPromise(guard, to, from, record))
    }

    return guards
}

// promise的组合函数
function runGuardsQueue(guards) { // [fn () => promise fn () => promise]
    // 链式调用
    return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve())
}

function createRouter(options) {
    // console.log(options) // {history: {}, routes: []}
    const routerHistory = options.history


    // console.log(routerHistory, 86)

    // console.log(options.routes) // 格式化路由的配置 拍平 /home home /a a 组件，这样的话比较好

    const matcher = createRouterMatcher(options.routes)



    // obj.value.新值 obj.value = 响应式数据

    // 后续改变数据的value就可以更新视图了
    const currentRoute = shallowRef(START_LOCATION_NORMALIZED)


    const beforeGuards = useCallback()
    const beforeResolveGuards = useCallback()
    const afterGuards = useCallback()



    function resolve(to) {
        // to可能是字符串 可能是对象
        // to = '/' to = {path: '/'}

        if (typeof to === 'string') {
            return matcher.resolve({
                path: to
            })
        } else {
            // 暂时没有考虑对象的情况
            return matcher.resolve(to)
        }
    }

    // 只能注册一次
    let ready
    function markAsReady() {// 用来
        if (ready) {
            return
        }
        ready = true // 用来标记已经渲染完毕
        routerHistory.listen((to) => {
            const targetLocation = resolve(to)
            const from = currentRoute.value

            // 在切换前进后退 是替换模式不是push模式
            finalizeNavigation(targetLocation, from, true)
        })

    }


    function finalizeNavigation(to, from, replaced) {
        // 第一次的话就直接replace
        if (from === START_LOCATION_NORMALIZED || replaced) {
            routerHistory.replace(to.path)
        } else {
            routerHistory.push(to.path)
        }
        currentRoute.value = to // 更新最新的路径
        // console.log(currentRoute.value, 157)

        // 监控前进和后退
        // 如果是初始化，我们还需要注入一个listen去更新currentRoute的值，这样数据变化后可以重新渲染试图

        // 标记
        markAsReady()


    }
    async function navigate(to, from) {
        // 在做导航的时候，需要知道哪个组件是进入的，哪个是离开的
        // 还要知道哪个组件是更新的

        // /home/a/b

        // /home/a/c

        // c是进入的，b是离开的    home和 a是更新的


        // 从to和from
        // 之中找哪些是离开 哪些是进入，哪些是更新
        const [leavingRecords, updatingRecords, enteringRecords] = extractChangeRecords(to, from )


        console.log(leavingRecords, updatingRecords, enteringRecords, 178)

        // 离开的时候，需要从后往前： /home/a /about

        // a销毁 home销毁 换成about

        let guards = extractComponentsGuards(
            leavingRecords.reverse(),
            'beforeRouteLeave',
            to,
            from
        )
        // console.log(guards, 215)

        // 如果guards里面有多个的话，需要按照顺序执行
        return runGuardsQueue(guards).then(() => {
            guards = []

            for (const guard of beforeGuards.list()) {
                guards.push(guardToPromise(guard, to, from, guard))
            }

            return runGuardsQueue(guards)
        }).then(() => {
            // guards = []
            guards = extractComponentsGuards(
                updatingRecords,
                'beforeRouteUpdate',
                to,
                from
            )
            // console.log()
            return runGuardsQueue(guards)
        }).then(() => {
            guards = []
            // beforeEnter
            for (const record of to.matched) {
                if (record.beforeEnter) {
                    guards.push(guardToPromise(record.beforeEnter, to, from, record))
                }
            }
            return runGuardsQueue(guards)
        }).then(() => {
            guards = extractComponentsGuards(
                enteringRecords,
                'beforeRouteEnter',
                to, from
            )
            return runGuardsQueue(guards)
        }).then(() => {
            guards = []
            // beforeEnter
            for (const guard of beforeResolveGuards.list()) {
                guards.push(guardToPromise(guard, to, from, guard))
            }
            return runGuardsQueue(guards)
        })

    }

    function pushWithRedirect(to) { // 通过路径匹配到对应的记录，更新 currentRoute

        const targetLocation = resolve(to)
        const from = currentRoute.value


        // 根据是不是第一次 ，来决定是push还是replace
        // console.log(targetLocation, 111, from)


        // 路由的导航守卫有几种 啊？？？
        /**
         * 全局钩子
         * 路由钩子
         * 组件钩子
         */

        navigate(targetLocation, from).then(() => {
            return finalizeNavigation(targetLocation, from)
        }).then(() => {
            // 当导航切换完毕后， 执行 afterEach
            for (const guard of afterGuards.list()) {
                guard(to, from)
            }
        })

        // 第一次的话，就直接replace了。直接产生新的路由


        // 路由的钩子在跳转前，可以做路由的拦截
    }

    function push(to) {
        // console.log(to)
        // debugger
        return pushWithRedirect(to)
    }

    // console.log(reactiveRoute)
    // reactiveRoute.path = 111
    // let { path } = reactive(reactiveRoute)
    // console.log(path)
    // path = 22
    // console.log(path)

    // START_LOCATION_NORMALIZED // reactive computed
    // console.log(currentRoute)
    // console.log(matcher)
    // debugger
    // const beforeGuards = useCallback()
    // const beforeResolveGuards = useCallback()
    // const afterGuards = useCallback()
    const router = {
        push,
        beforeEach: beforeGuards.add, // 这3个  可以注册多个，所以是一个发布订阅模式
        afterEach: afterGuards.add, //
        beforeResolve: beforeResolveGuards.add, //
        replace() {},
        install(app) {
            const router = this
            // vue2之中有两个属性，$router里面包含的是方法 $route里面包含的是属性
            app.config.globalProperties.$router = router // 方法
            // app.config.globalProperties.$route = currentRoute.value
            Object.defineProperty(app.config.globalProperties, '$route', { // 属性
                get: () => unref(currentRoute),
                enumerable: true
            })





            // 将数据使用计算属性再次包裹一次
            const reactiveRoute = {}
            for (let key in START_LOCATION_NORMALIZED) {
                reactiveRoute[key] = computed(() => {
                    return currentRoute.value[key]
                })
            }
            app.component('RouterLink', RouterLink)


            app.component('RouterView', RouterView)


            app.provide('router', router) // 暴露路由对象

            // let router = useRouter() // inject('router')
            app.provide('route location', reactive(reactiveRoute))

            // let route = useRoute() // inject('route location')



            // 路由的核心是什么？？？路径切换 更新页面 需要有一个响应式的变量
            // 路由的核心就是页面切换，重新渲染，
            // console.log('路由的安装')

            // 注册两个全局组件


            if (currentRoute.value == START_LOCATION_NORMALIZED) {
                // 默认是第一次，默认就是初始化
                // console.log("默认第一次", routerHistory)
                // 初始化需要通过路由系统先进行一次跳转，发生匹配
                push(routerHistory.location)
            }


            // console.log(beforeGuards.list())

            // 后续还有逻辑

            // 解析路径

            // 组件的实现RouterView RouterLink

            // 页面的钩子，从离开到进入
        }
    }

    return router
    // debugger
}

export {
    createWebHashHistory,
    createWebHistory,
    createRouter
}
