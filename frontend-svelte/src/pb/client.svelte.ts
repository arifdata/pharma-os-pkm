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

export async function addBMHP(item: string, input_tags: string): Promise<string> {
  //return early if the fields are empty
  if (item == "" || input_tags == "") {
    return "Isian tidak boleh kosong"
  }

  //get all master_bmhp_tags
  const current_tags = await pb.collection('master_bmhp_tags').getFullList();

  //empty object
  let map_tags: Record<string, string> = {};

  //empty relasi
  let relasi = [];

  //fill map_tags with pair key value tag and their id
  for (const tag of current_tags) {
    map_tags[tag['tag']] = tag['id'];
  }

  // split the input tags, if tag not in object create new in collection and then update the map_tags object
  const arr_input_tags = input_tags.split(",");
  for (const input_tag of arr_input_tags) {
    if (!Object.hasOwn(map_tags, input_tag)) {
      const body = {
        "tag": input_tag
      };
      const record = await pb.collection('master_bmhp_tags').create(body);
      map_tags[input_tag] = record['id'];
    }
    
    relasi.push(map_tags[input_tag]);
  }

  const body = {
    "nama_bmhp": item,
    "relasi": relasi
  };

  const record = await pb.collection('master_bmhp').create(body);
  return `Menambahkan ${record['nama_bmhp']}`
}
