<script lang="ts" setup>
import { ref } from 'vue'

const activeIndex = ref('/')
</script>

<style scoped>
.el-menu--horizontal>.el-menu-item:nth-child(1) {
    margin-right: auto;
}
</style>

<template>
    <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" :ellipsis="false" router>
        <el-menu-item index="" disabled class="logo-menu-item">
            <!-- <img style="width: 100px" src="/images/element-plus-logo.svg" alt="Element logo" /> -->
        </el-menu-item>
        <el-menu-item index="/">首页</el-menu-item>
        <el-sub-menu index="/game">
            <template #title>游戏</template>
            <!-- <el-menu-item index="2-1">item one</el-menu-item>
            <el-menu-item index="2-2">item two</el-menu-item>
            <el-menu-item index="2-3">item three</el-menu-item> -->
            <el-sub-menu index="/game/hypergryph">
                <template #title>鹰角</template>
                <el-menu-item index="/game/hypergryph/endfield">终末地</el-menu-item>
            </el-sub-menu>
        </el-sub-menu>
    </el-menu>
</template>

<style scoped>
.logo-menu-item.is-disabled {
    cursor: default !important;
    opacity: 1;
}
</style>