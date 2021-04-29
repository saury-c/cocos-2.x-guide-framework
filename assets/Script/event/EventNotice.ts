/*
 * @Author: saury
 * @Date: 2021-04-19 16:17:28
 * @Des: 简易版观察者
 * @Tips: 后续有兴趣可以自己替换
 */

export namespace EventNotice {

    let map: Map<any, Array<any>> = new Map();

    export function add(key, foo) {
        let arr = map.get(key) || [];
        arr.push(foo)
        map.set(key, arr);
    }

    export function remove(key, foo) {
        let arr = map.get(key);
        if (!arr || arr.length < 1) { return false; }
        let index = arr.indexOf(foo);
        if (index == -1) { return; }
        arr.splice(index, 1);
        return true;
    }

    export function emit(key, ...param) {
        let arr = map.get(key);
        if (!arr || arr.length < 1) { return; }
        arr.forEach((v, k) => {
            v(param);
        })
    }
}