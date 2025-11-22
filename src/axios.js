import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true, // IMPORTANT: Allows cookies to be sent/received
});

export default instance;
