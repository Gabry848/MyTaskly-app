import data from "./data";

import dayjs from "dayjs";
import axios from "axios";

export { login, refresh };

async function login(email: string, password: string) {
  var response = null;

  try {
    response = await axios.post("/login", {
      email: email,
      password: password,
    });
  } catch (error) {
    console.error(error);
  }

  // set data e tokens
  data.user.email = email;

  data.user.bearer_token = response?.data?.bearer_token;
  data.user.refresh_token = response?.data?.refresh_token;

  // token
  return response?.data?.bearer_token;
}

async function refresh() {
  var response = null;

  try {
    response = await axios.post("/refresh", {
      refresh_token: data.user.refresh_token,
    });
  } catch (error) {
    console.error(error);
  }

  // set data e tokens
  data.user.bearer_token = response?.data?.bearer_token;
  data.user.refresh_token = response?.data?.refresh_token;

  // token
  return response?.data?.bearer_token;
}

function ceck_token() {
  if (data.user.expires_at.isBefore(dayjs())) {
    refresh();
  }
}

// TODO: add filter
async function getData(path: string) {
  ceck_token();

  const token = data.user.bearer_token;
  var response:any = null;
  
  try {
    response = await axios.get(`/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
  }

  return response
}

// TODO: aggiungi aggiunta impegnie  categorie al server
