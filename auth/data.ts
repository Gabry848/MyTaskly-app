import dayjs from "dayjs";

export default {
  user: {
    email: "",
    bearer_token: null,
    refresh_token: null,
    expires_at: dayjs().add(15, 'minute'),
    login_time: dayjs(),
  },
};
