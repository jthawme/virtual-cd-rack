<template>
  <div class="content">
    <div v-resize="onResize" class="pool">
      <CD
        v-for="album in filteredAlbums"
        :key="album.barcode"
        class="pool-item"
        :class="{ 'pool-item-highlighted': album.data.mbid === highlight }"
        v-bind="album.data"
        :highlight="album.data.mbid === highlight"
      />
    </div>

    <aside>
      <div class="top">
        <div class="info">
          <p>
            This CD rack is digital, but it perfectly mirrors one that is not
            digital: my CD rack.
          </p>
          <p>
            Please, take a look and be amazed.
          </p>
        </div>
      </div>

      <div class="bottom">
        <div class="search">
          <span class="title">Search</span>
          <input
            v-model="currentFilter"
            type="search"
            placeholder="Artist, album"
          />
        </div>

        <div class="group">
          <span class="title">Random selection</span>
          <button @click="onRandom">Random</button>
          <button @click="highlight = null">Clear</button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import { search } from "fast-fuzzy";

import CD from "~/components/CD.vue";
import { randomArr, randomBetween } from "~/assets/js/utils";
export default {
  components: { CD },
  data() {
    return {
      loading: true,
      currentFilter: "",
      albums: [],
      highlight: null
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
            return obj.data.artists.map(artist => artist.title).join(" ");
          },
          threshold: 0.9
        });

        return [...new Set([...albums, ...artists])];
      }

      return this.albums;
    }
  },
  watch: {
    filteredAlbums() {
      requestAnimationFrame(() => {
        this.assignIndex();
      });
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
    },
    onRandom() {
      this.highlight = randomArr(this.filteredAlbums).data.mbid;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.$el.querySelector(".pool-item-highlighted").scrollIntoView({
            behavior: "smooth"
          });
        });
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.content {
  display: grid;

  grid-template-columns: calc(100% - (var(--spine-width) * 10)) 1fr;
  align-items: flex-start;
}

.pool {
  position: relative;

  display: grid;

  grid-template-columns: 1fr;

  perspective: 400px;

  z-index: 2;

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

  z-index: 1;

  background-color: var(--color-bg);

  input {
    display: block;

    -webkit-appearance: none;

    padding: 10px;
    margin: 0;

    border: none;

    width: 100%;

    font-size: inherit;

    outline: none;

    background-color: transparent;

    color: white;

    &::placeholder {
      color: #e5e5e5;
    }
  }
}

aside {
  position: sticky;

  top: 0;

  height: 100vh;

  color: white;

  display: flex;

  flex-direction: column;
  justify-content: space-between;

  .info {
    padding: 10px;

    p {
      font-weight: 500;
    }
  }

  .title {
    font-weight: 700;
    font-size: 10px;

    margin: 10px;
  }
}

.group {
  margin: 10px;

  .title {
    margin-left: 0;
    margin-right: 0;
  }

  button {
    display: block;

    border: none;

    background-color: rgba(0, 0, 0, 0.25);
    color: white;

    cursor: pointer;

    padding: 5px 10px;
    margin: 10px 0;
  }
}
</style>
