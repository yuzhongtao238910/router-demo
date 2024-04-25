import { h , inject, provide, computed } from "vue"
export const RouterView = {
    name: 'RouterView',
    // props: {
    //     name: ''
    // }
    setup(props, {slots}) { // setup默认只会执行一次
        // console.log("333333333333333")
        const depth = inject('depth', 0)
        // console.log(depth)
        const injectRoute = inject('route location')

        const matchedRouteRef = computed(() => {
            return injectRoute.matched[depth]
        })

        provide('depth', depth + 1)
        // console.log(injectRoute, 9)
        return () => { //  /a [home, a]
            // console.log(injectRoute.matched, 9)
            const matchRoute = matchedRouteRef.value // record
            // console.log(injectRoute, matchedRouteRef, depth, 20000)
            const viewComponent = matchRoute && matchRoute.components.default

            if (!viewComponent) {
                return slots.default && slots.default()
            }
            return h(viewComponent)
        }
    }
}
