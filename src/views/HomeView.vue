<template>
  <div class="home">
    首页
    <router-link to="/a">a页面</router-link>
    <router-link to="/b">b页面</router-link>
    <hr>

    <router-view></router-view>

    <hr>

    <router-view></router-view>
  </div>
</template>

<script>
// @ is an alias to /src


export default {
  name: 'HomeView',
  beforeRouteEnter(to, from, next) {
    console.log("beforeRouteEnter", to)
  },
  beforeRouteUpdate(to, from, next) {
    // 路由本身的更新
    console.log('beforeRouteUpdate')
  },
  beforeRouteLeave(to, from, next) {
    console.log('beforeRouteLeave', to)
  },
  mounted() {
    console.log(this.$router, this.$route)
  }
}

// a -> leave  （beforeRouteUpdate）
// b -> beforeEach
// b -> beforeEnter
// b -> beforeRouteEnter
// b -> resolve
// afterEach
</script>


















