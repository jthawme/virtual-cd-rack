export const CaptchaMixin = {
  methods: {
    getRecaptcha() {
      return new Promise(resolve => {
        // eslint-disable-next-line no-undef
        grecaptcha.ready(() => {
          // eslint-disable-next-line no-undef
          grecaptcha
            .execute(process.env.recaptcha, {
              action: "submit"
            })
            .then(token => {
              resolve(token);
            });
        });
      });
    }
  }
};
