import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { BaseTreenode, VTree } from "../src";

type Content = {
    id : string;
    title : string;
    children : Content[];
};

class TestNode extends BaseTreenode<Content> {
    private _content: Content;
    private _subtrees: this[];

    constructor(content: Content) {
        super();
        this._content = content;
        this._subtrees = content.children.map(c => new (this.constructor as any)(c));
        this.isFolding = false;
    }

    get id(): string { return this._content.id; }
    get name(): string { return this._content.title; }
    get styleClass(): object | null { return null; }
    get content(): Content { return this._content; }
    get subtrees(): this[] { return this._subtrees; }
    get isDraggable(): boolean { return true; }

    update(newContent: Content) {
        this._content = newContent;
    }

    rearrange(targetId: string, from: string, to: string, index: number) {
        const target = this.findNodeById(targetId)?.content;
        const exParent = this.findNodeById(from)?.content;
        const newParent = this.findNodeById(to)?.content;
        if (target === undefined || exParent === undefined || newParent === undefined) return;
        exParent.children = exParent.children.filter(child => child.id !== targetId);
        newParent.children.splice(index, 0, target);
        this._subtrees = this._content.children.map(c => new (this.constructor as any)(c));
    }
}

/**
 *  root(0)
 *  ├ one(1)
 *  │ └ one-one(11)
 *  └ two(2)
 */
const content = (): Content => ({
    id: "0"
    , title: "root"
    , children: [
        {
            id: "1"
            , title: "one"
            , children: [{ id: "11", title: "one-one", children: [] }]
        }
        , { id: "2", title: "two", children: [] }
    ]
});

const mountTree = () => mount(VTree, {
    props: { node: new TestNode(content()), version: 0 }
    , attachTo: document.body
});

/** onfinish / nextTick / setTimeout をまたぐ処理を待ち切る */
const flush = async () => {
    for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
        await nextTick();
    }
};

describe("select", () => {
    test("クリックしたノードとともに emit される", async () => {
        const wrapper = mountTree();

        await wrapper.find('li[data-id="1"] .tree-item').trigger("click");

        const emitted = wrapper.emitted("select");
        expect(emitted).toHaveLength(1);
        expect((emitted![0]![0] as TestNode).id).toBe("1");
    });

    test("ツリー外のクリックで undefined とともに emit される", async () => {
        const wrapper = mountTree();

        await wrapper.find('li[data-id="1"] .tree-item').trigger("click");
        document.dispatchEvent(new Event("click", { cancelable: true }));
        await nextTick();

        const emitted = wrapper.emitted("select")!;
        expect(emitted).toHaveLength(2);
        expect(emitted[1]![0]).toBeUndefined();
    });
});

describe("update-name", () => {
    test("ダブルクリックで編集を始め、blur で変更が emit される", async () => {
        const wrapper = mountTree();

        await wrapper.find('li[data-id="1"] .tree-item').trigger("dblclick");
        expect(wrapper.emitted("toggle-editing")![0]).toEqual(["1", true]);

        const input = wrapper.find('li[data-id="1"] input');
        await input.setValue("renamed");
        await input.trigger("blur");

        expect(wrapper.emitted("toggle-editing")![1]).toEqual(["1", false]);
        expect(wrapper.emitted("update-name")).toEqual([["1", "renamed"]]);
    });

    test("名前が変わっていなければ emit されない", async () => {
        const wrapper = mountTree();

        await wrapper.find('li[data-id="1"] .tree-item').trigger("dblclick");
        await wrapper.find('li[data-id="1"] input').trigger("blur");

        expect(wrapper.emitted("toggle-editing")![1]).toEqual(["1", false]);
        expect(wrapper.emitted("update-name")).toBeUndefined();
    });
});

describe("rearrange", () => {
    // dragend はドロップ位置へゴーストを飛ばすため、ブラウザ専用の API を使う。happy-dom は
    // どれも実装していないので、呼び出しが成立する最小限のスタブを置く。
    const originalGetComputedStyle = globalThis.getComputedStyle;
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

    /** すべての行をこの高さとして扱う。中央は 10px なので clientY で挿入位置を決められる */
    const ROW_HEIGHT = 20;

    beforeEach(() => {
        // Element.animate 未実装。dragend は animate().onfinish で確定処理を行う。
        (Element.prototype as unknown as { animate: unknown }).animate = () => {
            const animation: { onfinish: (() => void) | null } = { onfinish: null };
            setTimeout(() => animation.onfinish?.(), 0);
            return animation;
        };
        // CSSStyleDeclaration が iterable でないため、ゴーストへのスタイル複写が落ちる。
        globalThis.getComputedStyle = (() => ({
            boxSizing: "border-box"
            , getPropertyValue: () => ""
            , getPropertyPriority: () => ""
            , [Symbol.iterator]: function* () {}
        })) as unknown as typeof globalThis.getComputedStyle;
        // レイアウトを持たないので矩形がすべて 0 になり、挿入位置を指定できない。
        Element.prototype.getBoundingClientRect = () => ({
            x: 0, y: 0, top: 0, left: 0, right: 100, bottom: ROW_HEIGHT
            , width: 100, height: ROW_HEIGHT, toJSON: () => ({})
        }) as DOMRect;
    });

    afterEach(() => {
        globalThis.getComputedStyle = originalGetComputedStyle;
        Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    test("別のノードの子へドロップすると、その位置とともに emit される", async () => {
        const wrapper = mountTree();
        // dragstart 以降は mirage（ドラッグ中の li のクローン）も同じ data-id を持つので、
        // 対象は先に掴んでおく。掴み直すと DOM 上先に現れる mirage の方を引く。
        const dragged = wrapper.find('li[data-id="2"]');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        // 行の中央より下 = 既存の子の後ろに入る
        await wrapper.find('ul.subtree[data-id="1"]').trigger("dragenter", { clientY: 100 });
        await dragged.trigger("dragend", { clientY: 100 });
        await flush();

        // 2 を 0 の下から 1 の下へ。1 は既に 11 を持つので index は 1
        expect(wrapper.emitted("rearrange")).toEqual([["2", "0", "1", 1]]);
    });

    test("同じ親の中で前に動かすと index 0 で emit される", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="2"]');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        // 先頭の行の中央より上 = 兄の手前に入る
        await wrapper.find('ul.subtree[data-id="0"]').trigger("dragenter", { clientY: 0 });
        await dragged.trigger("dragend", { clientY: 0 });
        await flush();

        expect(wrapper.emitted("rearrange")).toEqual([["2", "0", "0", 0]]);
    });

    test("ドロップ先が無いまま終わった場合は emit されない", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="2"]');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        await dragged.trigger("dragend", { clientY: 0 });
        await flush();

        expect(wrapper.emitted("rearrange")).toBeUndefined();
    });
});
