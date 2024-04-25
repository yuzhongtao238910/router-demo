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
function createRouteRecordMatcher(record, parent) {
    // 创造匹配记录，构建父子关系
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
export function createRouterMatcher(routes) {
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

    function resolve(location) { // {path: '/', matched: HomeRecord}
//// {path: '/a', matched: [HomeRecord, ARecord]}
        const matched = []

        let path = location.path

        let matcher = matchers.find(m => {
            return m.path == path
        })

        while(matcher) { // 一直找它的父亲

            matched.unshift(matcher.record) //将用户的原始数据放到matched上面
            matcher = matcher.parent
        }

        return {
            path: path,
            matched
        }
    }

    return {
        resolve, // 解析路由
        addRoute // 动态的添加路由 面试问：路由动态的添加，这就是动态的api
    }
}

