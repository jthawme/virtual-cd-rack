<template>
  <div class="content">
    <div class="search">
      <input
        v-model="currentFilter"
        type="search"
        placeholder="Artist, album"
      />
    </div>
    <div v-resize="onResize" class="pool">
      <CD
        v-for="album in filteredAlbums"
        :key="album.barcode"
        class="pool-item"
        v-bind="album.data"
      />
    </div>
  </div>
</template>

<script>
import { search } from "fast-fuzzy";

import { onWindowResize, tickUpdate } from "~/assets/js/utils";
import CD from "~/components/CD.vue";
export default {
  components: { CD },
  data() {
    return {
      loading: true,
      currentFilter: "",
      albums: []
    };
  },
  computed: {
    filteredAlbums() {
      if (this.currentFilter) {
        const albums = search(this.currentFilter, this.albums, {
          keySelector: obj => obj.data.title,
          threshold: 0.8
        });

        const artists = search(this.currentFilter, this.albums, {
          keySelector: obj => {
            console.log(obj.data.artists.map(artist => artist.title).join(" "));
            return obj.data.artists.map(artist => artist.title).join(" ");
          },
          threshold: 0.9
        });

        return [...new Set([...albums, ...artists])];
      }

      return this.albums;
    }
  },
  mounted() {
    this.loadData();

    // onWindowResize(tickUpdate(this.assignIndex.bind(this)));
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
    },
    onResize() {
      this.assignIndex();
    }
  }
};
</script>

<style lang="scss" scoped>
.pool {
  position: relative;

  display: grid;

  grid-template-columns: 1fr;

  perspective: 400px;

  width: calc(100% - (var(--spine-width) * 11));
  margin-left: var(--spine-width);

  padding-bottom: 50px;

  &:before {
    position: absolute;

    top: 0;
    right: 100%;

    width: var(--spine-width);
    height: 100%;

    content: "";

    background-color: var(--color-bg);

    z-index: 10000;
  }

  &-item {
    z-index: calc(var(--highest-index, 0) - var(--index));
  }

  @include tablet {
    grid-template-columns: repeat(auto-fill, minmax(var(--spine-width), 1fr));
  }
}

.search {
  position: relative;

  z-index: 10000;

  background-color: var(--color-bg);

  input {
    display: block;

    -webkit-appearance: none;

    padding: 10px;
    margin: 0;

    border: none;

    width: 100%;

    font-size: 4vw;

    outline: none;

    background-color: transparent;

    color: white;

    &::placeholder {
      color: #e5e5e5;
    }
  }
}
</style>
