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
  return authData;
}

export async function logout() {
  pb.authStore.clear();
}
