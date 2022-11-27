<template>
  <div class="content">
    <markdown :content="`**some** markdown`" />
  </div>
</template>

<script>
export default {
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      const { albums } = await this.$store.getters
        .load()
        .then(resp => resp.json());

      console.log(albums);
    }
  }
};
</script>

<style lang="scss" scoped></style>
