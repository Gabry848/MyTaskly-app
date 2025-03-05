/*
a module for get data from the server with http requests and bearer token
in this module we have a function for get data from the server with http requests and bearer token
this function get a url and a bearer token and return a promise
*/

import axios from "axios";
import requestData from "../config/requestData.json";

// get section from the server
function getSections() {
  let token = requestData.user.bearerToken;

  return axios.get(
    requestData.httpRequest.BaseURL + requestData.httpRequest.sections,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

// Esporta tutte le funzioni
export { getSections };
