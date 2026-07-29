let _ref = $state<{ add: (params: Record<string, any>) => void } | null>(null);

export const notif = {
  get ref() {
    return _ref;
  },
  set ref(v) {
    _ref = v;
  },
  add(params: Record<string, any>) {
    _ref?.add(params);
  },
};
