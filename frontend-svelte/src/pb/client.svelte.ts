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

export async function addBMHP(item: string, input_tags: string): Promise<{ok: boolean, msg: string}> {
  //return early if the fields are empty
  if (item == "" || input_tags == "") {
    return {ok: false, msg: "Isian tidak boleh kosong"}
  }

  //get all master_bmhp_labels
  const current_labels = await pb.collection('master_bmhp_labels').getFullList();

  //empty object
  let map_labels: Record<string, string> = {};

  //empty relasi
  let relasi_labels = [];

  //fill map_labels with pair key value label and their id
  for (const label of current_labels) {
    map_labels[label['label']] = label['id'];
  }

  // split the input labels, if label not in object create new in collection and then update the map_labels object
  const arr_input_labels = input_tags.split(",");
  for (const input_label of arr_input_labels) {
    if (!Object.hasOwn(map_labels, input_label)) {
      const body = {
        "label": input_label
      };
      const record = await pb.collection('master_bmhp_labels').create(body);
      map_labels[input_label] = record['id'];
    }
    
    relasi_labels.push(map_labels[input_label]);
  }

  const body = {
    "nama_bmhp": item,
    "labels": relasi_labels
  };

  const record = await pb.collection('master_bmhp').create(body);
  return {ok: true, msg: `Menambahkan ${record['nama_bmhp']}`}
}
