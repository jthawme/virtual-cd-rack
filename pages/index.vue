<template>
  <div class="content">
    <div class="pool">
      <CD
        v-for="album in albums"
        :key="album.barcode"
        class="pool-item"
        v-bind="album.data"
      />
    </div>
  </div>
</template>

<script>
import { onWindowResize, tickUpdate } from "~/assets/js/utils";
import CD from "~/components/CD.vue";
export default {
  components: { CD },
  data() {
    return {
      loading: true,
      albums: []
    };
  },
  mounted() {
    this.loadData();

    onWindowResize(tickUpdate(this.assignIndex.bind(this)));
  },
  methods: {
    async loadData() {
      const { albums } = await this.$store.getters
        .load()
        .then(resp => resp.json());

      albums.sort((a, b) =>
        (a.sortName || a.data.title).localeCompare(b.sortName || b.data.title)
      );

      this.albums = albums;

      this.loading = false;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.assignIndex();
        });
      });
    },
    assignIndex() {
      const items = [...this.$el.querySelectorAll(".pool-item")];
      const total = [];

      items.forEach(item => {
        item.style.setProperty("--index", item.offsetLeft);
        total.push(item.offsetLeft);
      });

      this.$el.style.setProperty("--highest-index", Math.max(...total));
    }
  }
};
</script>

<style lang="scss" scoped>
.pool {
  display: grid;

  grid-template-columns: repeat(auto-fill, minmax(var(--spine-width), 1fr));

  perspective: 400px;

  width: calc(100% - (var(--spine-width) * 10));

  &-item {
    z-index: calc(var(--highest-index, 0) - var(--index));
  }
}
</style>
