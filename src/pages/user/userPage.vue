<script setup lang="ts">

</script>

<template>
    <el-card>
        <el-descriptions title="User Info" :column="3">
            <el-descriptions-item label="Id">1</el-descriptions-item>
            <el-descriptions-item label="Username">kooriookami</el-descriptions-item>
            <el-descriptions-item label="Email">kooriookami@example.com</el-descriptions-item>
            <el-descriptions-item label="Phone">+852 1234 5678</el-descriptions-item>
            <el-descriptions-item label="Remarks">
                <el-tag size="small">Admin</el-tag>
            </el-descriptions-item>
        </el-descriptions>
        <el-descriptions title="Binded Game Accounts" :column="3">
            <el-descriptions-item label="Arknights">kooriookami#1234</el-descriptions-item>
            <el-descriptions-item label="Genshin Impact">kooriookami#5678</el-descriptions-item>
        </el-descriptions>
    </el-card>
</template>

<style scoped></style>