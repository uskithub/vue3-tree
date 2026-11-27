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

    // 以下、行（.tree-item）の上での振り分け（D-12）。行の高さは 20px なので、
    // 上の端は clientY < 5、下の端は clientY >= 15、その間が真ん中。

    test("行の上の端にドロップすると、その行の前の兄弟になる", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="2"]');
        const row = wrapper.find('li[data-id="1"] > .tree-item');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        await row.trigger("dragenter", { clientY: 2 });
        await dragged.trigger("dragend", { clientY: 2 });
        await flush();

        expect(wrapper.emitted("rearrange")).toEqual([["2", "0", "0", 0]]);
    });

    test("行の下の端にドロップすると、その行の後ろの兄弟になる", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="11"]');
        const row = wrapper.find('li[data-id="2"] > .tree-item');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        await row.trigger("dragenter", { clientY: 18 });
        await dragged.trigger("dragend", { clientY: 18 });
        await flush();

        // 11 を 1 の下から 0 の下へ。1, 2 の後ろなので index は 2
        expect(wrapper.emitted("rearrange")).toEqual([["11", "1", "0", 2]]);
    });

    test("開いていて子のある行の下の端では、子の後ろでなく、その行の後ろの兄弟になる", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="11"]');
        const row = wrapper.find('li[data-id="1"] > .tree-item');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        await row.trigger("dragenter", { clientY: 18 });
        await dragged.trigger("dragend", { clientY: 18 });
        await flush();

        // 11 を 1 の下から 0 の下へ。1 の後ろ・2 の前なので index は 1
        expect(wrapper.emitted("rearrange")).toEqual([["11", "1", "0", 1]]);
    });

    test("行の真ん中にドロップすると、その行の子になる", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="2"]');
        const row = wrapper.find('li[data-id="1"] > .tree-item');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        await row.trigger("dragenter", { clientY: 10 });
        await dragged.trigger("dragend", { clientY: 10 });
        await flush();

        expect(wrapper.emitted("rearrange")).toEqual([["2", "0", "1", 1]]);
    });

    test("同じ行の中で端と真ん中を行き来すると、ドロップ先が切り替わる", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="2"]');
        const row = wrapper.find('li[data-id="1"] > .tree-item');
        const parentUl = wrapper.find('ul.subtree[data-id="0"]');
        const childUl = wrapper.find('ul.subtree[data-id="1"]');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });

        await row.trigger("dragenter", { clientY: 2 });
        expect(parentUl.classes()).toContain("drop-target");
        expect(parentUl.element.children[0]!.classList.contains("mirage")).toBe(true);

        await row.trigger("dragover", { clientY: 10 });
        expect(parentUl.classes()).not.toContain("drop-target");
        expect(childUl.classes()).toContain("drop-target");
        expect(childUl.element.querySelector(":scope > .mirage")).not.toBeNull();

        await row.trigger("dragover", { clientY: 2 });
        expect(childUl.classes()).not.toContain("drop-target");
        expect(parentUl.classes()).toContain("drop-target");

        await dragged.trigger("dragend", { clientY: 2 });
        await flush();

        expect(wrapper.emitted("rearrange")).toEqual([["2", "0", "0", 0]]);
    });

    test("掴んでいる行のすぐ前になる位置は動かない移動で、emit されない", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="2"]');
        const row = wrapper.find('li[data-id="1"] > .tree-item');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        // いったん 1 の前に置いてから、1 の後ろ（= 2 のすぐ前）へ
        await row.trigger("dragenter", { clientY: 2 });
        await row.trigger("dragover", { clientY: 18 });
        expect(wrapper.find(".mirage").exists()).toBe(false);
        expect(wrapper.find(".drop-target").exists()).toBe(false);
        await dragged.trigger("dragend", { clientY: 18 });
        await flush();

        expect(wrapper.emitted("rearrange")).toBeUndefined();
    });

    test("掴んでいる行の子孫の行の上では、ドロップ先にならない", async () => {
        const wrapper = mountTree();
        const dragged = wrapper.find('li[data-id="1"]');
        const row = wrapper.find('li[data-id="11"] > .tree-item');

        await dragged.trigger("dragstart", { dataTransfer: new DataTransfer() });
        await row.trigger("dragenter", { clientY: 2 });
        await row.trigger("dragover", { clientY: 10 });
        await dragged.trigger("dragend", { clientY: 10 });
        await flush();

        expect(wrapper.emitted("rearrange")).toBeUndefined();
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
