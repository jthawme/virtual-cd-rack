export const state = () => {
  return {
    endpoint: "",
    domain: ""
  };
};

export const mutations = {
  setEndpoint(state, val) {
    state.endpoint = val;
  },
  setDomain(state, val) {
    state.domain = val;
  },
  setRecaptchaKey(state, val) {
    state.recaptchaKey = val;
  }
};

export const getters = {
  api: state => path => {
    return `${state.endpoint}${path}`;
  },
  search: (state, getters) => data => {
    return fetch(getters.api("/search"), {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  add: (state, getters) => data => {
    return fetch(getters.api("/add"), {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  load: (state, getters) => data => {
    return fetch(getters.api("/load"));
  }
};

export const actions = {
  async nuxtServerInit({ commit }, { env }) {
    commit("setEndpoint", env.endpoint);
    commit("setDomain", env.PROJECT_DOMAIN);
    commit("setRecaptchaKey", env.recaptcha);
  }
};
