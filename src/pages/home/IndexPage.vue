<script setup lang="ts">
import { basicCheckAPI } from "../../common/api/basic";

const checkHealth = async () => {
    try {
        const response = await basicCheckAPI();
    } catch (error) {
    }
};
</script>

<template>
    Bonjour
    <!-- <el-button type="primary" @click="checkHealth">Health Check</el-button> -->
</template>