<script lang="ts" setup>
import { ref } from 'vue'

const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
</script>

<style scoped>
.el-menu--horizontal>.el-menu-item:nth-child(1) {
    margin-right: auto;
}
</style>

<template>
    <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" :ellipsis="false"
        @select="handleSelect" router>
        <el-menu-item index="0">
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