import PocketBase from "pocketbase";

export const pb = new PocketBase("http://localhost:8090");

let _authState = $state({
  isLoggedIn: pb.authStore.isValid,
  user: pb.authStore.record,
});

export function getAuthState() {
  return _authState;
}

pb.authStore.onChange(() => {
  _authState.isLoggedIn = pb.authStore.isValid;
  _authState.user = pb.authStore.record;
});

export async function login(email: string, password: string) {
  const authData = await pb.collection("_superusers").authWithPassword(email, password);
  _authState.isLoggedIn = true;
  _authState.user = authData.record;
  return authData;
}

export async function logout() {
  pb.authStore.clear();
  _authState.isLoggedIn = false;
  _authState.user = null;
}

export async function add(item: string, tags: string) {
  const records = await pb.collection('master_bmhp_tags').getFullList().then((v) => console.log(v));
  // console.log(records);

  var arr_tags = tags.split(",")
  const body = {
    "nama_bmhp": item,
    "tags": ["mantap"]
  }

  // const record = await pb.collection('master_bmhp').create(body);
  // console.log(item, arr_tags);
}
