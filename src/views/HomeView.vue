<template>
  <div class="home">
    首页
    <router-link to="/a">a页面</router-link>
    <router-link to="/b">b页面</router-link>
    <hr>

    <router-view></router-view>
  </div>
</template>

<script>
// @ is an alias to /src


export default {
  name: 'HomeView',
}
</script>
