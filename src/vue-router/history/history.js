function buildState(back, current,forward, replace= false,computedScroll = false) {
    return {
        back,
        current,
        forward,
        replace,
        scroll: computedScroll ? {left: window.pageXOffset, top: window.pageYOffset} : null,
        // 默认是从2开始的
        position: window.history.length - 1 // 跳转的历史记录
    }
}
// 创建一个当前的location对象，因为location对象上面可以拿到pathname 等属性
function createCurrentLocation(base) {
    const {pathname, search, hash} = window.location

    const hasPos = base.indexOf('#') // 就是hash /about -> #/about
    if (hasPos > -1) {
        return base.slice(1) || '/'
    }
    // console.log(window.location)
    // 在浏览器的URL中，#（井号）后面确实会被认为是hash部分
    return pathname + search + hash
}
function useHistoryStateNavigation(base) {
    const currentLocation = {
        value: createCurrentLocation(base)
    }
    const historyState = {
        value: window.history.state
    }
    // console.log(currentLocation, historyState)
    // console.log(historyState, 62)
    // 第一次刷新页面，此时没有任何状态，那么我就自己维护一个状态  后退后是哪个，当前的是哪个 要去哪里
    // 我是用的push跳转还是replace跳转，跳转的滚动条在哪里，跳转后的滚动条的位置
    if (!historyState.value) {

        const res = buildState(null, currentLocation.value, null, true)
        // console.log(res)
        changeLocation(currentLocation.value, res, true)
    }

    // to 目的地
    // state 状态
    // replace模式
    function changeLocation(to, state, replace) {
        const hasPos = base.indexOf('#') // 就是hash /about -> #/about
        const url = hasPos > -1 ? base + to : to
        // 默认来更新一下状态
        window.history[replace ? 'replaceState' : 'pushState'](state, null, url)
        historyState.value = state // 将自己生成的状态同步到 路由系统之中
        // console.log(state)
    }

    function push(to, data) {
        // push 里面会changeLocation两次，希望有一个跳转的过程，便于更好的控制
        // 去哪里，带的新的状态是什么？ pushState
        // a -> b 将要跳转 和 跳转完成
        const currentState = Object.assign({},
            historyState.value, // 当前的逻辑/状态
            {
                forward: to,
                scroll: {
                    left: window.pageXOffset,
                    top: window.pageYOffset
                }
            }
        )
        // 本质是没有跳转的，只是更新了状态，后续再vue之中可以详细的监控到vue的状态的变化
        changeLocation(currentState.current, currentState, true)


        const state = Object.assign(
            {},
            buildState(currentLocation.value, to, null),
            {
                position: currentState.position + 1
            },
            data
        )

        // 才是真正的更改了路径
        changeLocation(to,  state, false) // 真的发生跳转
        currentLocation.value = to // 替换后需要将路径变为现在的路径
        // 跳转的过程更加精细
        // 跳转的时候，我需要做两个状态
        /*
        跳转前：从哪里去哪里
        跳转后：
         */
    }
    function replace(to, data) {
        // 去哪里，带的新的状态是什么？
        const state = Object.assign({},
            buildState(historyState.value.back, to,historyState.value.forward, true),
            data
        )
        // replaceState
        changeLocation(to, state, true)
        currentLocation.value = to // 替换后需要将路径变为现在的路径
    }

    return {
        location: currentLocation,
        state: historyState,
        push,
        replace
    }
}



// 前进后退的时候 需要更新 historyState 和 currentLocation 这两个变量
function useHistoryListeners(base, historyState, currentLocation) {
    const listeners = []
    const popStateHandler = ({state}) => { // state是最新的状态，已经前进后退完毕后的状态
        // console.log(state, 145)
        // 需要知道当前要去哪里？？
        const to = createCurrentLocation(base)
        // 从那里来了
        const from = currentLocation.value
        const fromState = historyState.value // 从哪里来的状态


        currentLocation.value = to
        historyState.value = state // state可能为空 null


        // 看是前进还是后退？？？
        let isBack = (state.position - fromState.position) < 0

        // console.log(isBack, 161)
        listeners.forEach(listener => listener(to, from, {isBack}))

        // 用户在这里扩展？？？

    }
    // 监听前进 后退
    window.addEventListener('popstate', popStateHandler) // 只能监听浏览器的前进后退

    function listen(cb) {
        listeners.push(cb)
    }

    return {
        listen
    }

}
export function createWebHistory(base = '') {
    const historyNavigation = useHistoryStateNavigation(base)

    // 监听浏览器go back时候的状态的变化
    const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location)

    const routerHistory = Object.assign({}, historyNavigation, historyListeners)

    Object.defineProperty(routerHistory, 'location', {
        get() {
            return historyNavigation.location.value
        }
    })
    Object.defineProperty(routerHistory, 'state', {
        get() {
            return historyNavigation.state.value
        }
    })

    return routerHistory


    // routerHistory.location 代表当前的路径

    // routerHistory.state 代表当前的状态

    // push replace 切换路径和状态

    // listen可以接受用户的回调，当用户前进后退的时候，可以触发此方法

}



// 当前的路径 状态 路由的信息
// const routerHistory = createWebHistory() // 默认使用h5的路由

// const routerHistory = createWebHashHistory()
//
// // console.log(routerHistory.location, routerHistory.state)
// routerHistory.listen((to, from , {isBack}) => {
//     console.log(to, from , isBack)
// })
