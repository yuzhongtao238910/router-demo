import { createWebHashHistory } from "./history/hash.js"
import { createWebHistory } from "./history/history.js"

// 拍平路由的数据处理，options.routes是用户的配置，难以理解，不好维护，使用的时候也不方便
/*
/ => record {Home}

/a => record {A, parent: Home}

/b => record {B, parent: Home}

/about => record {About}


当用户访问： /a 的时候，找到/a对应的记录 会渲染home和a

如果home里面还有parent的话，就是先渲染home的parent，在渲染home，最后渲染a

 */

function normalizeRouteRecord(record) { // 格式化用户的参数
   return {
        path: record.path, // 状态机 解析路径的分数 算出匹配规则
        meta: record.meta || {},
       // 钩子函数
        beforeEnter: record.beforeEnter,
        name: record.name,
        components: {
            default: record.component // 循环
        },
        children: record.children || []
    }

}
function createRouteRecordMatcher(record, parent) { // 创造匹配记录，构建父子关系
    // 对record之中的path做一些修改 // 正则的情况
    // 这块不考虑正则了
    const matcher = {
        path: record.path,
        record,
        parent,
        children: []
    }

    if (parent) {
        parent.children.push(matcher)
    }

    return matcher
}


// 树的遍历
function createRouterMatcher(routes) {
    const matchers = []
    function addRoute(route, parent) {
        let normalizedRecord = normalizeRouteRecord(route)
        if (parent) {
            normalizedRecord.path = parent.path + normalizedRecord.path
        }
        // console.log(normalizedRecord, 39)
        const matcher = createRouteRecordMatcher(normalizedRecord, parent)
        if ('children' in normalizedRecord) {
            let children = normalizedRecord.children
            for (let i = 0; i < children.length; i++) {
                addRoute(children[i], matcher)
            }
        }
        matchers.push(matcher)
    }
    routes.forEach(route => {
        addRoute(route)
    })
    // console.log(matchers)

    return {
        addRoute // 动态的添加路由 面试问：路由动态的添加，这就是动态的api
    }
}

function createRouter(options) {
    // console.log(options) // {history: {}, routes: []}
    const routerHistory = options.history
    // console.log(options.routes) // 格式化路由的配置 拍平 /home home /a a 组件，这样的话比较好

    const matcher = createRouterMatcher(options.routes)


    const router = {
        install(app) {
            // 路由的核心是什么？？？路径切换 更新页面 需要有一个响应式的变量
            // 路由的核心就是页面切换，重新渲染，
            // console.log('路由的安装')

            // 注册两个全局组件
            app.component('RouterLink', {
                setup: (props, {slots, attrs, emit, expose}) => {
                    return () => {
                        return (
                            <a>{
                                slots.default && slots.default()
                            }</a>
                        )
                    }
                }
            })


            app.component('RouterView', {
                setup(props, {slots}) {
                    return () => {
                        return (
                            <div>空的</div>
                        )
                    }
                }
            })



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
