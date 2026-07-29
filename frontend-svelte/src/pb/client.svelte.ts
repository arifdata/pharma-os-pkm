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

export async function add(item: string, input_tags: string): any {
  if (item == "" || input_tags == "") {
    return "Isian tidak boleh kosong"
  }
  const current_tags = await pb.collection('master_bmhp_tags').getFullList();
  let map_tags = {};

  for (const tag of current_tags) {
    map_tags[tag['tag']] = tag['id'];
  }

  const arr_input_tags = input_tags.split(",");

  // const body = {
  //   "nama_bmhp": item,
  //   "tags": ["mantap"]
  // }

  // return 0

  // const record = await pb.collection('master_bmhp').create(body);
  // console.log(item, arr_tags);
}
