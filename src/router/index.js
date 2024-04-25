import { createRouter, createWebHistory, createWebHashHistory } from '../vue-router/index.js'
import Home from '../views/HomeView.vue'
import About from '../views/AboutView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {},
    children: [
      {
        path: 'a',
        component: {
          render() {
            return (
                <h1>a页面</h1>
            )
          }
        },
        children: [
          {
            path: '/dd',
            component: {
              render() {
                return (
                    <h3>2222</h3>
                )
              }
            }
          }
        ]
      },
      {
        path: 'b',
        component: {
          render() {
            return (
                <h1>b页面</h1>
            )
          }
        }
      }
    ],
    beforeEnter(to, from ,next) {
      console.log("before-enter", to)
    }
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: About
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})



// 全局钩子

// 导航开始之前
router.beforeEach((to, from ,next) => {
  console.log('beforeEach', 'to')
})

// 导航解析完成
router.beforeResolve((to, from ,next) => {
  console.log('beforeResolve', 'to')
})


//
router.afterEach((to, from,next) => {
  console.log('afterEach', 'to')
})

export default router
























