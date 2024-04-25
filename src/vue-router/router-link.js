import { h, inject } from "vue"


function useLink(props) {
    const router = inject('router')
    function navigate() {

        // console.log(router, props)
        // debugger
        router.push(props.to)
        // console.log("跳转！！！")
    }
    return {
        navigate
    }
}
export const RouterLink = {
    name: 'RouterLink',
    props: {
        to: {
            type: [String, Object],
            required: true
        }
    },
    setup(props, {slots}) {
        // console.log(props, slots, 21)
        const link = useLink(props)
        return () => {
            return h('a', {
                onClick:link.navigate
            }, slots.default && slots.default())
        }
    }
}
