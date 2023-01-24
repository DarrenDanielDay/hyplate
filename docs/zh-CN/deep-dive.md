# 由浅入深

本文将从开始介绍`Hyplate`的设计思路，以及相应的取舍。

你可以在`stackblitz`上尝试`Hyplate`：

[![在StackBlitz中打开](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/DarrenDanielDay/hyplate/tree/main/examples/count)

本文中示例的代码大多都包含了所有必要的代码。你可以通过将其复制并全部替换`index.tsx`的内容来尝试运行。

## 基本概念

随着 TypeScript 的发展与流行，越来越多的 API 文档都通过 TypeScript 风格的类型来解释用法。`Hyplate`的源代码使用 TypeScript 编写，因此对于基本概念的介绍，也将使用 TypeScript 类型作为辅助。

### AttachFunc

```ts
export type AttachFunc = (el: Node) => void;
```

`AttachFunc`是一个函数，它接收一个 DOM 节点，用于描述处理传入的 DOM 节点的执行逻辑。

`Hyplate`提供了一些工具函数来创建他们。通常的`AttachFunc`是将节点追加到元素的内部，成为父子元素关系，但也有少数情况下需要将节点插入在节点的前面/后面，成为兄弟关系。

```ts
import { appendChild } from "hyplate";
// 通过工具函数appendChild创建一个AttachFunc
const attach: AttachFunc = appendChild(document.querySelector("#app"));
// 上述代码作用等同于
const parent = document.querySelector("#app");
const attach: AttachFunc = (node) => parent.appendChild(node);
```

几乎所有的 DOM 树结构相关的操作都与挂载函数有关，因此理解`AttachFunc`非常重要。

### CleanUpFunc

```ts
export type CleanUpFunc = () => void;
```

一个无参无返回值函数，用于描述清除副作用的执行逻辑。

清除副作用包括但不限于取消事件监听/订阅，关闭/断开连接，销毁外部的 DOM 树等等一系列可能的回收/释放资源的操作。

### Mountable\<E\>

```ts
export type Mountable<E extends ExposeBase> = (attach: AttachFunc) => Rendered<E>;

// 相关类型定义
export type ExposeBase = {} | void;

export type Rendered<E extends ExposeBase> = [cleanup: CleanUpFunc, exposed: E, range: GetRange];

export type GetRange = () => readonly [Node, Node] | undefined | void;
```

`Mountable<E>`同样是一个函数。它接收一个`AttachFunc`，并返回`Rendered<E>`。

`Mountable<E>`的作用是描述如何创建 DOM 元素，执行可能的副作用，并将创建的 DOM 元素移交传入的`AttachFunc`进行挂载。在执行完主要逻辑后，返回副作用的清除方法、暴露的操作方法、获取实际渲染的 DOM 范围的方法。

将`GetRange`设计成函数而非数组是出于渲染的 DOM 范围可能动态改变的考虑。

事实上，`Mountable<E>`本身也可以作为组件化的方案使用，但缺少可配置的选项——外部很难控制他们。

### FunctionalComponent\<P, C, E\>

```ts
export type PropsBase = {};

export type FunctionalComponent<P extends PropsBase = PropsBase, C = undefined, E extends ExposeBase = void> = (
  props: Props<P, C, E>
) => Mountable<E>;
// FC是FunctionalComponent的别名
export { type FunctionalComponent as FC };
```

在`Mountable<E>`外再加上一层接收配置项 `props` 的函数，就变成了函数组件。目前，这样的柯里化设计，是为了使得用户代码层面可以更加精细化地控制复用逻辑的层次——是在组件执行时，还是挂载时。

范型`C`用于指定`props.children`的类型。如果为`undefined`，则`props`不必传入`children`字段。和`React`一样，在 JSX 内，子节点会转换成`props.children`传给函数组件/类组件。

范型`E`用于指定`props.ref`的类型。类似于`React`，在 JSX 中你可以通过传入`ref`对象来获取 DOM 实例、暴露的 API。

理解了这些概念后，如果使用 VanillaTS（不使用`Hyplate`的任何工具函数，只使用类型）编写一个计数器函数组件，大概会是这样：

```ts
import type { FC } from "hyplate/types";
interface CounterExposed {
  addCount(): void;
}

const Counter: FC<{ msg: string }, undefined, CounterExposed> = (props) => {
  const displayMessage = `Hello, ${props.msg}!`;
  return (attach) => {
    const button = document.createElement("button");
    attach(button);
    let count = 0;
    const getCounterText = () => `count = ${count}`;
    const countText = document.createTextNode(getCounterText());
    button.append(countText);
    const addCount = () => {
      count++;
      countText.data = getCounterText();
    };
    button.addEventListener("click", addCount);
    const cleanup = () => {
      button.removeEventListener("click", addCount);
    };
    const exposed: CounterExposed = { addCount };
    return [cleanup, exposed, () => [button, button]];
  };
};

const [cleanup, exposed, getRange] = Counter({ msg: "world" })((node) => {
  document.body.appendChild(node);
});
// 通过exposed，在外部控制内部的状态
exposed.addCount();
setTimeout(() => {
  // 通过cleanup来清除副作用
  cleanup();
  // 通过getRange来移除（主要场景）或移动（较少场景）节点
  const [begin, end] = getRange() ?? [];
  for (let node = begin; node && node !== end; node = node.nextSibling) {
    node.parentElement?.removeChild(node);
  }
  if (end) {
    end.parentElement?.removeChild(end);
  }
}, 10000);
```

借助`Hyplate`提供的工具函数，这些代码可以简化成这样：

```ts
import type { FC } from "hyplate/types";
import { appendChild, content, element, listen, removeRange, text } from "hyplate/core";

interface CounterExposed {
  addCount(): void;
}

const Counter: FC<{ msg: string }, undefined, CounterExposed> = (props) => {
  const displayMessage = `Hello, ${props.msg}!`;
  return (attach) => {
    const button = element("button");
    let count = 0;
    const getCounterText = () => `count = ${count}`;
    const countText = text(getCounterText());
    button.append(countText);
    attach(button);
    const addCount = () => {
      count++;
      countText.data = getCounterText();
    };
    const cleanup = listen(button)("click", addCount);
    const exposed: CounterExposed = { addCount };
    return [cleanup, exposed, () => [button, button]];
  };
};

const [cleanup, exposed, getRange] = Counter({ msg: "world" })(appendChild(document.body));
// 通过exposed，在外部控制内部的状态
exposed.addCount();
setTimeout(() => {
  // 通过cleanup来清除副作用
  cleanup();
  // 通过getRange来移除（主要）或移动（较少场景）节点
  removeRange(getRange);
}, 10000);
```

或许你已经注意到了在这个例子中，定义状态`count`定义的位置不在`FC`内，而是在返回的`Mountable`内。事实上，定义在`FC`内也可以，但是要小心，如果将创建的`Mountable`多次挂载，容易产生一些 bug。

如果这样定义组件：

```ts
const Counter: FC = (props) => {
  let count = 0;
  return (attach) => {
    //...
  };
};
```

那么重复的挂载操作将会导致两个按钮的 addCount 共享同一个状态量，造成混乱：

```ts
const mountable = Counter({});
mountable(appendChild(node1));
mountable(appendChild(node2));
```

如果能够确保类似的以上代码不会产生，那么直接在函数组件内声明状态没有问题，也是更加符合习惯上的写法。至于使用哪种风格进行代码组织，完全取决于用户。

### Subscribable\<T\>

或许以上的例子对实际开发还不够友好——需要编写维护状态和 DOM 之间的同步的代码。因此我们需要一种自动响应状态变化的模式，也就是观察者模式。

如果你比较熟悉观察者模式，那么你大概能够猜到`Subscribable<T>`的意图——从概念上来说，它就是`Observable<T>`，但为了与诸如`rxjs`、`mobx`等提供响应式编程能力的 JavaScript 库的概念加以区分而**刻意**换了个名称。

然而，如果你尝试查看`Subscribable<T>`的类型定义，你会发现它什么也没有：

```ts
export interface Subscribable<T> {}
```

这样设计的目的，也是为了能够与这些响应式库进行融合，让开发者对于 JavaScript 的状态库能有更多的选择——将逻辑层面最重要的响应式方案固定并不是`Hyplate`所期望的，这违背了`Hyplate`的主要动机。

通过声明合并的方式定义需要使用的响应式方案，并通过调用`configureBinding(subscribe, isSubscribable)`注册相应的 API，这个概念才能拥有意义：

```ts
import { configureBinding } from "hyplate/binding";
import { isObservable, Observable } from "rxjs";
configureBinding((observable, subscriber) => {
  const subscription = observable.subscribe(subscriber);
  return () => {
    subscription.unsubscribe();
  };
}, isObservable);
declare module "hyplate/types" {
  export interface Subscribable<T> extends Observable<T> {}
}
```

为了能够测试这个观察者模式，`Hyplate`也内置了一个简单的观察者模式实现，但它默认是不启用的，需要显式调用`enableBuiltinStore()`来设置。如果这部分实现的代码没有被使用，也能够被摇树优化自动剔除。

```ts
import { enableBuiltinStore } from "hyplate/store";
import type { Query } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}
```

上述两类注册 API 的代码只需在借助`Subscribable<T>`进行任何绑定之前执行即可，通常而言，只需在入口文件内调用一次。

注册完观察者模式的实现后，`Hyplate`的绑定 API 将变得可用。借助这些绑定 API，我们的计数器示例的代码可以简化成这样：

```ts
import { $text } from "hyplate/binding";
import { appendChild, element, listen, removeRange } from "hyplate/core";
import { enableBuiltinStore, source } from "hyplate/store";
import type { FC } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}
interface CounterProps {
  msg: string;
}
interface CounterExposed {
  addCount(): void;
}

const Counter: FC<CounterProps, undefined, CounterExposed> = (props) => {
  return (attach) => {
    const count = source(0);
    const button = element("button");
    // 生成的Text节点也需要传递一个AttachFunc，用于插入
    const unbindText = $text`Hello, ${props.msg}! count = ${count}`(appendChild(button));
    attach(button);
    const addCount = () => {
      // 设置source的值，触发更新
      count.set(count.val + 1);
    };
    const unbindEvent = listen(button)("click", addCount);
    const exposed: CounterExposed = { addCount };
    const cleanup = () => {
      unbindEvent();
      // 不要忘记将取消订阅作为清除副作用的一部分
      unbindText();
    };
    return [cleanup, exposed, () => [button, button]];
  };
};

const [cleanup, exposed, getRange] = Counter({ msg: "world" })(appendChild(document.body));
exposed.addCount();
setTimeout(() => {
  cleanup();
  removeRange(getRange);
}, 10000);
```

后文有关`Subscribable`的内容，都会使用`Hyplate`内置的观察者模式实现（`source`与`query`）作为例子。

## 逻辑组件

仅支持绑定文本和属性，对于稍微复杂一些的页面或许就不够用了。`Hyplate`考虑了常见的两个常见需求，设计了两个用于处理条件渲染和列表渲染逻辑的组件——他们也是函数组件，并且`props`接收`Subscribable`，通过`Subscribable`来订阅更新DOM。

### 条件渲染

条件渲染有`If`和`Show`两个组件——他们只是 API 风格有一些区别，内部的核心逻辑是完全一致——订阅`Subscribable`，当订阅到值时，移除上一次渲染的内容，若为真值，执行true result的渲染函数，否则执行false result的渲染函数。

一个简单的切换例子：

```ts
import { appendChild, content, element, listen, text } from "hyplate/core";
import { If } from "hyplate/directive";
import { enableBuiltinStore, source } from "hyplate/store";
import type { FC } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}

const Toggle: FC = () => {
  return (attach) => {
    const show = source(false);
    const button = element("button");
    content(button, "toggle");
    attach(button);
    const toggle = () => {
      show.set(!show.val);
    };
    const unbindEvent = listen(button)("click", toggle);
    // If的用法
    const [cleanupIf, , getRange] = If({
      condition: show,
      children: {
        then: (attach) => {
          const message = text("I'm there!");
          attach(message);
          return [() => {}, undefined, () => [message, message]];
        },
        // 可以传入`else`，此处略
      },
    })(attach);
    const cleanup = () => {
      unbindEvent();
      cleanupIf();
    };
    return [cleanup, undefined, () => [button, getRange()![1]]];
  };
};

Toggle({})(appendChild(document.body));
```

对于使用`Show`的情况，只需要换一换props：

```ts
import { appendChild, content, element, listen, text } from "hyplate/core";
import { Show } from "hyplate/directive";
import { enableBuiltinStore, source } from "hyplate/store";
import type { FC } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}

const Toggle: FC = () => {
  return (attach) => {
    const show = source(false);
    const button = element("button");
    content(button, "toggle");
    attach(button);
    const toggle = () => {
      show.set(!show.val);
    };
    const unbindEvent = listen(button)("click", toggle);
    // If的用法
    const [cleanupShow, , getRange] = Show({
      when: show,
      children: (attach) => {
        const message = text("I'm there!");
        attach(message);
        return [() => {}, undefined, () => [message, message]];
      },
      // 可以传入`fallback`，此处略
    })(attach);
    const cleanup = () => {
      unbindEvent();
      cleanupShow();
    };
    return [cleanup, undefined, () => [button, getRange()![1]]];
  };
};

Toggle({})(appendChild(document.body));
```

### 列表渲染

列表渲染只有一个`For`组件。其展开后的`props`的类型定义：

```ts
interface ExpandedForProps<T extends unknown> {
  of: Subscribable<ArrayLike<T>>;
  children: (item: T) => Mountable<any>;
}
```

其中，`of`是可订阅的数组——当然不一定得是数组，只要它像一个数组，有`length`属性并能通过数字索引访问元素即可。
`children`则是一个接收数组元素的渲染函数，并返回任意的`Mountable`。

如果将我们的计数器套上列表，使用起来会像是这样：

```ts
import { $text } from "hyplate/binding";
import { appendChild, content, element, listen, removeRange } from "hyplate/core";
import { For } from "hyplate/directive";
import { enableBuiltinStore, source } from "hyplate/store";
import type { FC } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}
interface CounterProps {
  msg: string;
}
interface CounterExposed {
  addCount(): void;
}

const Counter: FC<CounterProps, undefined, CounterExposed> = (props) => {
  return (attach) => {
    const count = source(0);
    const button = element("button");
    const unbindText = $text`Hello, ${props.msg}! count = ${count}`(appendChild(button));
    attach(button);
    const addCount = () => {
      count.set(count.val + 1);
    };
    const unbindEvent = listen(button)("click", addCount);
    const exposed: CounterExposed = { addCount };
    const cleanup = () => {
      unbindEvent();
      unbindText();
    };
    return [cleanup, exposed, () => [button, button]];
  };
};

const App: FC = () => {
  return (attach) => {
    const counterList = source<CounterProps[]>([]);
    const container = element("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    const attachContainer = appendChild(container);
    const addCounter = element("button");
    content(addCounter, "add counter item");
    attachContainer(addCounter);
    let id = 0;
    const unbindEvent = listen(addCounter)("click", () => {
      counterList.set(
        counterList.val.concat({
          msg: `counter${id++}`,
        })
      );
    });
    attach(container);
    // 最重要的用法代码在这里
    const [cleanupFor] = For({ of: counterList, children: (props) => Counter(props) })(attachContainer);
    const cleanup = () => {
      cleanupFor();
      unbindEvent();
    };
    return [cleanup, void 0, () => [container, container]];
  };
};

App({})(appendChild(document.body));
```

或许这个例子看上去有些糟糕——后文会介绍JSX，可以让这些代码看起来更加清晰。

列表渲染的算法是 JavaScript 框架在面临需要渲染大量元素时的性能最主要的因素。`Hyplate`的列表渲染照搬了`Vue.js 3`的双端`diff`算法，并砍掉了虚拟 DOM 与 patch 的部分。

但是，如果你了解`Vue.js`的`v-for`指令，你会发现`Hyplate`少了一个`key`。事实上，`Hyplate`使用列表项自身作为`key`——比较列表项的引用来判断是否能复用已经渲染的DOM。这样做正是因为`Hyplate`没有虚拟DOM——没有前后虚拟DOM的对比，意味着列表项内部的更新应当在内部完成订阅。事实上，这也和函数组件/`Mountable`只会在创建时执行一次相呼应——因为他们的职责就是创建元素，需要一个新的元素，那就执行他们，而更新已创建的元素不需要执行创建元素的逻辑，所以不需要重复执行他们，并且更新也总是通过订阅的方式。

## 基于模板的组件

经过了上述计数器的例子，我们通过一些工具 API 完成了数据的绑定和事件侦听器的添加。但创建元素的代码仍然比较麻烦——例子中只有一个`button`元素，当我们需要构建一棵拥有大量元素的 DOM 时候，代码量就会变得非常庞大，并且难以阅读和维护。`Hyplate`也设计了一种通过 HTMLTemplateElement 一次性创建大量元素的方案。

### 基本 API

你可以通过`template`函数来创建一个 HTML 模板元素，然后通过`clone`来拷贝它的内容：

```ts
import { template } from "hyplate/template";
import { clone } from "hyplate/core";
const example = template(`
  <p>The HTMLTemlate</p>
  <p>in string!</p>
`);
const fragment = clone(example.content);
```

有了模板和拷贝的碎片，即使需要创建的元素变多了，也可以使用较少的创建代码：

```ts
import { $text } from "hyplate/binding";
import { appendChild, clone, element, listen, removeRange } from "hyplate/core";
import { enableBuiltinStore, source } from "hyplate/store";
import { template } from "hyplate/template";
import type { FC } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}
interface CounterProps {
  msg: string;
}
interface CounterExposed {
  addCount(): void;
}
// 模板内容永远不会变，因此它可以仅在全局创建一次
const counterTemplate = template(`
  <p>some</p>
  <p>extra</p>
  <p>content</p>
  <button></button>
`);
const Counter: FC<CounterProps, undefined, CounterExposed> = (props) => {
  return (attach) => {
    const count = source(0);
    const fragment = clone(counterTemplate.content);
    // 需要注意的是，组件的节点范围变成了碎片的第一个和最后一个子节点
    const begin = fragment.firstChild!,
      end = fragment.lastChild!;
    // 通过查询获取碎片里的元素
    const button = fragment.querySelector("button")!;
    const unbindText = $text`Hello, ${props.msg}! count = ${count}`(appendChild(button));
    attach(fragment);
    const addCount = () => {
      count.set(count.val + 1);
    };
    const unbindEvent = listen(button)("click", addCount);
    const exposed: CounterExposed = { addCount };
    const cleanup = () => {
      unbindEvent();
      unbindText();
    };
    return [cleanup, exposed, () => [begin, end]];
  };
};

const [cleanup, exposed, getRange] = Counter({ msg: "world" })(appendChild(document.body));
exposed.addCount();
setTimeout(() => {
  cleanup();
  removeRange(getRange);
}, 10000);
```

### 进一步封装

或许你已经注意到，维护副作用清除、获取组件元素范围这两者的代码非常繁琐——尤其是当我们通过模板来创建元素时，还需要小心`fragment`内的节点在`attach(fragment)`后将被移出碎片的陷阱。

针对常见的模板操作，例如拷贝、范围、内容节点获取、副作用清除函数收集进行封装，`Hyplate`也提供了更高层的抽象与封装。事实上，`Counter`的代码里我们主要关心的逻辑内容是这些：

```ts
const count = source(0);
$text`Hello, ${props.msg}! count = ${count}`(appendChild(button));
const addCount = () => {
  count.set(count.val + 1);
};
listen(button)("click", addCount);
const exposed: CounterExposed = { addCount };
```

对于`$text`和`listen`产生的副作用需要在组件卸载时全部执行，可以用一个数组存起来，然后在 cleanup 中一起调用。参考 React 的做法，可以将这个特殊的家伙隐藏在一个全局上下文里，作为 hooks 魔法提供。

`button`作为视图查询的结果，可以作为模板碎片操作相关的**上下文输入**。

exposed 更像是一个组件的产出，像是一个**结果**。

将这几个特性抽象来看，最理想的用户代码是一个接收 props 输入与 context 输入的，处理初始化逻辑的函数，我们姑且称之为`setup`函数。

于是，使用这样的封装后，用户代码大概是这样：

```ts
import { pure } from "hyplate";
import { $text } from "hyplate/binding";
import { appendChild, listen, removeRange } from "hyplate/core";
import { useCleanUp } from "hyplate/hooks";
import { enableBuiltinStore, source } from "hyplate/store";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}
interface CounterProps {
  msg: string;
}
interface CounterExposed {
  addCount(): void;
}
const Counter = pure(
  `
  <p>some</p>
  <p>extra</p>
  <p>content</p>
  <button></button>
`,
  // 传入一个函数，用于fragment内的查询
  (fragment) => ({ button: fragment.querySelector("button")! })
)((props: CounterProps, ctx): CounterExposed => {
  const count = source(0);
  // 查询结果将作为函数的第二个参数
  const button = ctx.button;
  // 使用hooks简化副作用注册
  useCleanUp($text`Hello, ${props.msg}! count = ${count}`(appendChild(button)));
  const addCount = () => {
    count.set(count.val + 1);
  };
  useCleanUp(listen(button)("click", addCount));
  // 将exposed作为返回内容
  return {
    addCount,
  };
});

const [cleanup, exposed, getRange] = Counter({ msg: "world" })(appendChild(document.body));
exposed.addCount();
setTimeout(() => {
  cleanup();
  removeRange(getRange);
}, 10000);
```

现在，组件内逻辑变得清晰了许多——主要的逻辑都在 setup 函数内，使得变得更加像是声明式。

柯里化的函数看起来还是有些复杂，以及 appendChild 是主要的场景，可以尝试使用这套链式调用风格的 hooks：

```ts
import { pure } from "hyplate";
import { appendChild, removeRange } from "hyplate/core";
import { enableBuiltinStore, source } from "hyplate/store";
import { useBinding } from "hyplate/toolkit";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}
interface CounterProps {
  msg: string;
}
interface CounterExposed {
  addCount(): void;
}
const Counter = pure(
  `
  <p>some</p>
  <p>extra</p>
  <p>content</p>
  <button></button>
`,
  (fragment) => ({ button: fragment.querySelector("button")! })
)((props: CounterProps, ctx): CounterExposed => {
  const count = source(0);
  const addCount = () => {
    count.set(count.val + 1);
  };
  useBinding(ctx.button).text`Hello, ${props.msg}! count = ${count}`.event("click", addCount);
  return {
    addCount,
  };
});

const [cleanup, exposed, getRange] = Counter({ msg: "world" })(appendChild(document.body));
exposed.addCount();
setTimeout(() => {
  cleanup();
  removeRange(getRange);
}, 10000);
```

### 编译查询代码

当需要从模板里获取的元素越来越多时，编写查询碎片内容的代码也会变得很麻烦，并且在同一个碎片上多次执行`querySelector`的性能并不容乐观——尤其是当需要多次创建碎片，也就是渲染列表的时候，性能问题就容易暴露出来。

由于模板的内容是完全静态的，我们可以利用编译器去生成这些获取 DOM 的代码。`Hyplate`的这个编译逻辑参考了`SolidJS`对 JSX 做的魔法——编译输出节点变量的声明，以及获取`firstChild`和`nextSibling`。

`Hyplate`没有选择在 JSX 里做这样的魔法，而是选择了使用 HTML 模板文件，并为其生成 JavaScript 输出，是出于**关注点分离**的考虑。模板是静态的内容，易于静态分析，也能更容易地交付于界面设计师去编写——尽管界面设计师不一定需要实际地编写 HTML 或 CSS，但是无逻辑的模板也更有利于与可视化设计工具的连接。

因此，目前`Hyplate`的模板**只有一个标记节点的语法**，没有其他模板语法，所有的编程能力，包括文本插值、属性绑定、事件监听都需要使用 JavaScript 去组织。这是对纯粹的 HTML 模板的美好设想，至于这样设计是否会遇到实践性问题，还需要一些使用上的反馈。

模板标记的语法参考了`Angular`的模板变量，使用`#`表示。尽管这仍然是合法的 HTML 语法，但是`Hyplate`的编译器会对这个标记做一些特殊处理。

举例而言，下列模板文件：

```html
<template #todo>
  <div class="container">
    <ul #list>
      <template #item>
        <li>
          <input type="checkbox" />
          <span #text></span>
        </li>
      </template>
    </ul>
  </div>
</template>
```

将编译成以下 JavaScript 代码：

```js
import { shadowed as f, pure as p } from "hyplate/template";
import { firstChild as c, nextSibling as n } from "hyplate/identifiers";
// [#todo] [#item]
const _0_0 = p(`<li><input type="checkbox" /><span></span></li>`, (d) => {
  const _$node0 = d,
    _$node1 = _$node0[c],
    _$node2 = _$node1[c][n];
  return {
    refs: {
      text: _$node2,
    },
  };
});
// [#todo]
const _0 = f(`<div class="container"><ul></ul></div>`, (d) => {
  const _$node0 = d,
    _$node1 = _$node0[c],
    _$node2 = _$node1[c];
  return {
    refs: {
      list: _$node2,
    },
  };
});
_0["item"] = _0_0;
export { _0 as todo };
```

使用时的代码大概像是这样，

```js
import { todo } from "./the-template.js";
const Todo = todo((props, ctx) => {
  console.log(ctx.refs.list); // HTMLUListElement
});
const Item = todo.item((props, ctx) => {
  console.log(ctx.refs.text); // HTMLSpanElement
});
```

其中的`shadowed`作用和`pure`类似，用于封装模板，返回一个接收 setup 函数的工厂函数，但是在挂载时会额外创建一个容器元素（默认为`<div>`），并将克隆出的模板碎片追加到容器的 shadow DOM 子树中。后文的[插槽](#插槽)章节将解释为什么要这样做。

编译器可以配置选择使用哪个工厂，详见 API 文档。

非`<template>`元素上的标记名称将被作为引用名称，可在 setup 函数中的 context.ref 里获取。同级的引用名称不可重复。

`<template>`元素上的标记名称将作为模板的一个引用。顶层模板的标记名称（例子中的`todo`）会作为模块的导出名称（`export { _0 as todo }`），嵌套的模板（例子中的`item`）将作为父级模板的属性（`_0['item'] = _0_0`）。

对于缺省标记名称的`<template>`元素，将会尝试使用`default`作为名称。对`<template>`的标记名称而言，同级的标记名称不可重复，顶层的标记名称除了不可重复以外，也必须是合法的 JavaScript 标识符（变量名）。

### 插槽

仅通过获取碎片内的元素进行操作的模板还不够灵活。得益于 Shadow DOM API 与`<slot>`，我们可以通过插槽声明占位元素，然后在外部给它赋值。

对于通常的做法，`<slot>`用起来会是这样：

```html
<template>
  <div>
    <!-- 在模板中定义插槽 -->
    <slot name="the-slot"></slot>
  </div>
</template>
<!-- 在JavaScript中注册自定义元素，例如my-custom-element -->
<!-- 在HTML中使用 -->
<my-custom-element>
  <!-- 名称必须匹配 -->
  <div slot="the-slot"></div>
</my-custom-element>
```

可以看到这种使用方式必须要保证内外的名称一致。不过还有一种通过编程的方式赋值`<slot>`的内容，它需要三个步骤：

1. 在`attachShadow`时设置 slotAssignment 为`"manual"`
2. 将目标元素插入到`shadowRoot`的`host`的子节点下
3. 调用 shadow DOM 中`<slot>`元素的`assign`方法并传入所有目标节点

这样一来，我们便可以通过 TypeScript 来校验`slot`名称的拼写——不必担忧类型的编写，这些类型定义同样可以被`Hyplate`的编译器生成。

在`Hyplate`的模板中使用`<slot>`：

```html
<template>
  <div>
    <slot name="the-slot"></slot>
  </div>
</template>
```

在 JavaScript 代码中使用：

```js
import { appendChild } from "hyplate/core";
import template from "./the-template.js";
const Component = template(() => {
  // setup...
});
// 使用时，传入特殊属性`children`
Component({
  children: {
    "the-slot": new Text("the content Node or Mountable<any>"),
  },
})(appendChild(node));
```

插槽只对于`shadowed`和`replaced`有效，`pure`不会处理`props.children`。

`shadowed`和`replaced`的区别是，前者使用 shadow DOM API，并使用真正的`HTMLSlotElement.assign()`，而`replaced`仅仅原地将`<slot>`元素替换成内容，并且不会创建 shadow DOM。`replaced`更加有助于`debug`——插槽替换后的 DOM 结构将被完整地还原。不推荐在生产模式下使用`replaced`，它是一个设计上的历史遗留问题，目前也仅推荐用于`debug`。

### 样式表

shadow DOM 的一个非常棒功能——样式隔离。这使得外部的样式表很难影响到内部的样式，除了通过 css 变量。因此，如果在模板内添加`<style>`元素并编写样式表，这些样式可以成为 shadow DOM 的一部分，并自动成为**局部的**。

但是一些场景下可能需要将样式表抽取出来——特别是当你希望使用 CSS 预处理器的时候。

这便是编译器选项`externalStyleSheet`的作用。支持的选项有三种模式：

- `false`: 不进行任何处理，保留在模板字符串中
- `"link"`: 生成样式表文件，并在模板字符串中替换成通过 link 元素引用（默认，对 ES Module 更加友好，无需打包即可使得`@import`导入其他样式表的规则生效）
- `"import"`: 生成样式表文件，并在模板字符串中替换成空的 style 元素占位，以及 JavaScript 中通过 import 语句导入（适合使用打包器、无 shadow DOM、slot 的传统场景）

关于 CSS 预处理器的支持仍在设计中。

## JSX

### JSX 表达式

目前在`Hyplate`中，JSX 表达式的类型，即`JSX.Element`，就是`Mountable<any>`——这意味着 JSX 表达式的类型是一个函数，而不是像 React 那样的对象。

```jsx
const node = <div></div>;
console.log(typeof node); // 'function'
```

调用`Mountable`并传入`AttachFunc`可以直接进行挂载，因此你可以这样做：

```jsx
import { appendChild } from "hyplate/core";
(<div>Hello, world!</div>)(appendChild(document.body));
```

但是，benchmark 的测试证实，这样的实现在有非常多的 JSX 表达式时会大量创建函数闭包，导致非常消耗内存。**在未来，JSX 表达式的类型可能会变成对象**。

为了保证兼容性，推荐使用`mount`方法挂载 JSX 元素。

```jsx
import { appendChild } from "hyplate/core";
import { mount } from "hyplate/jsx-runtime";

mount(<div>Hello, world!</div>, appendChild(document.body));
```

同样，调用`mount`也会返回`Rendered`，但遗憾的是，由于 JSX.Element 没有`exposed`信息，所以`mount`返回的类型被设置为`Rendered<any>`。

对于 JSX 表达式挂载后的`exposed`，根据使用的三种`tag`有三种不同的`exposed`：

1. 原生 HTML 元素的标签，`exposed`是创建的 DOM 元素
2. 函数组件，`exposed`是函数组件的`exposed`
3. 类组件（后文会介绍），`exposed`是组件类

### 编译 JSX

`Hyplate`的 JSX Factory 只有一个实现函数，并提供了四种不同的导出名称：

- `jsx`
- `jsxs`
- `h`
- `createElement`

和大多数`react-like`的 JavaScript 库一样，你可以使用任何你熟悉的工具来编译 JSX，例如`babel`，`swc`，`esbuild`。你也可以直接使用 TypeScript 编译 JSX，推荐的转换模式是`react-jsx`，并指定`jsxImportSource`为`"hyplate"`。

```json
// tsconfig.json
{
  "compilerOptions": {
    // ...
    "jsx": "react-jsx",
    "jsxImportSource": "hyplate"
  }
  // ...
}
```

### JSX 属性、文本与绑定

JSX 的灵活之处在于，可以使用 JavaScript 进行自由组合——因为它们本身就会编译成 JavaScript 函数调用。

因此，在 JSX 属性中完成繁琐的属性绑定、文本插值、事件侦听器添加逻辑也更加直观，而`Hyplate`的 JSX 也做了这一点：

```tsx
import { mount } from "hyplate";
import { appendChild } from "hyplate/core";
import { source, enableBuiltinStore } from "hyplate/store";
import type { FC } from "hyplate/types";

enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}

const Count: FC<{ msg: string }> = ({ msg }) => {
  const count = source(0);
  return (
    <div class="app">
      <div>Hello, {msg}!</div>
      <button
        onClick={() => {
          count.set(count.val + 1);
        }}
      >
        add count
      </button>
      <div>You clicked {count} times.</div>
    </div>
  );
};

mount(<Count msg="hyplate"></Count>, appendChild(document.body));
```

这让`Hyplate`的代码看起来很像`React`。但是，要小心的是，`Hyplate`的**函数组件只会在创建时执行一次**。

这意味着，函数组件没有`props`更新的逻辑：因为没有 virtual DOM，没有需要执行第二次来与上一次进行 diff 的必要。所有的更新都需要通过`Subscribable`。

因此，使用`Hyplate`的 JSX 时，你将会有和`React`完全不一样的心智模型：

1. 函数组件没有 hooks 的魔法：hooks 只能在基于模板的组件的 setup 内使用。
2. 订阅式更新：如果传给 JSX 属性/JSX 文本的值是一个`Subscribable`，那么订阅将在挂载后产生，并且卸载时自动退订。
3. 函数组件不需要保证没有副作用：你可以在函数组件内执行任何你想要的副作用，因为函数体不会因为组件的更新而被重复执行。

如果你比较细心，你可能会发现这个使用 JSX 的函数组件的例子不易于自定义副作用。但是，如果你理解了在 `Hyplate` 中 JSX 表达式的本质是一个`Mountable`以后，你可以想到这样的代码：

```tsx
import { appendChild } from "hyplate/core";
import { mount } from "hyplate/jsx-runtime";
import { source, enableBuiltinStore } from "hyplate/store";
import type { FC } from "hyplate/types";

enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}

const Count: FC<{ msg: string }> = ({ msg }) => {
  const count = source(0);
  return (attach) => {
    const [jsxCleanup, exposed, getRange] = mount(<div class="app">{/* 省略了内容 */}</div>, attach);
    const cleanup = () => {
      jsxCleanup();
      console.log("my custom cleanup logic here!");
    };
    // exposed是`div.app`
    return [cleanup, exposed, getRange];
  };
};

mount(<Count msg="hyplate"></Count>, appendChild(document.body));
```

得益于`Mountable`是一个函数的灵活特性，你可以通过加一层更具体的`Mountable`，并在`Mountable`函数体中挂载 JSX 表达式创建的`Mountable`，来自定义诸如`cleanup`的部分。

但要小心的是，手动编写`Moutable`函数需要把挂载的 DOM 范围弄清楚。通常而言，如果在 mountable 内调用多个 mount，只需要使用 DOM 结构最外层的范围即可：

```tsx
import { appendChild } from "hyplate/core";
import { mount, jsxRef, unmount } from "hyplate/jsx-runtime";
import type { FC } from "hyplate/types";

const App: FC = () => {
  return (attach) => {
    const headerRef = jsxRef<HTMLElement>();
    const footerRef = jsxRef<HTMLElement>();
    const [cleanupApp, exposed, getAppRange] = mount(
      <div class="app">
        <header ref={headerRef}></header>
        <footer ref={footerRef}></footer>
      </div>,
      attach
    );
    const [cleanupHeader] = mount(<div>the header</div>, appendChild(headerRef.current!));
    const [cleanupFooter] = mount(<div>the footer</div>, appendChild(footerRef.current!));
    const cleanup = () => {
      cleanupFooter();
      cleanupHeader();
      cleanupApp();
      console.log("my custom cleanup logic here!");
    };
    // 对于DOM范围，只需要使用最外层的`div.app`的范围即可
    return [cleanup, exposed, getAppRange];
  };
};

const rendered = mount(<App />, appendChild(document.body));
setTimeout(() => {
  unmount(rendered);
}, 3000);
```

相信你注意到了`jsxRef`这个 API。它的实现非常简单，仅仅是创建一个带有`current`属性并初始化为`null`的对象并返回。这个返回的对象和`React.useRef`返回的对象作用类似，但`jsxRef`不是像 hooks 一样的魔法函数，调用它会直接创建一个新的对象。而对于用法，也和`React`的`ref`差不多，可以用于获取 DOM——事实上是获取`exposed`。`ref.current`在 JSX 被`mount`后立即可用——因为`mount`是完全同步的。

### JSX 与事件处理

在`Hyplate`的 JSX 中，添加事件处理有三种模式。

#### 属性模式

用法上，是使用`oneventname={handler}`。

和原生 DOM 的 event handler attributes 一样，handler 应当是一个字符串。尽管字符串的代码很难编写与维护，但他们也是合法的 HTML 属性。`Hyplate`非常重视保留原生的能力——尤其是为了让开发者能用上那些比较新的特性。

#### 直连模式

用法上，是使用`onEventname={handler}`——与属性模式不同的是，你需要将事件名的第一个字母改成大写。`on`后的所有字母都会被转换成小写，并通过`addEventListener`添加为事件侦听器，并在`Mountable`的`cleanup`中移除侦听器。

这一点和`Preact`有点像——他们是原生的监听器，而不是像`React`那样的合成事件处理函数，这意味着你可以使用`function`与`this`，甚至可以用一个对象：

```ts
export interface ObjectEventHandler<E extends Event> {
  handleEvent(event: E): void;
  options?: EventHandlerOptions;
}
```

通过传入对象处理器，你可以在添加侦听器的时候为`addEventListener`传入第三个参数`options`来使用一些较新的特性：

```jsx
import { appendChild } from "hyplate/core";
import { mount } from "hyplate/jsx-runtime";
import { enableBuiltinStore, source } from "hyplate/store";
import type { FC } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}

const Counter: FC<{ signal: AbortSignal }> = (props) => {
  const count = source(0);
  return (
    <button
      onClick={{
        handleEvent() {
          count.set(count.val + 1);
        },
        options: {
          // 给事件监听器加上AbortSignal
          signal: props.signal,
        },
      }}
    >
      count = {count}
    </button>
  );
};

const controller = new AbortController();
mount(<Counter signal={controller.signal} />, appendChild(document.body));

setTimeout(() => {
  controller.abort("we canceled the event handler from outside!");
}, 5000);
```

或许这是更贴近原生的副作用批量清理的模式——因为 fetch API 产生的副作用也可以通过`AbortSignal`来控制。

#### 委托模式

当你需要渲染一个大的列表的时候，给每个元素添加事件侦听器并不太合适——这会浪费一些性能，并且已经在基线测试里被证实。

参考了`Svelte`和`SolidJS`的做法，`Hyplate`也支持使用事件委托模式添加事件处理函数。

举例而言，你可以这样为一个列表项目添加监听函数：

```tsx
import { appendChild } from "hyplate/core";
import { mount } from "hyplate/jsx-runtime";
import type { FC } from "hyplate/types";

const App: FC = () => {
  const items = ["foo", "bar", "baz"];
  return (
    <div>
      <ul>
        {items.map((item) => (
          <li
          {/* JSX属性名的写法是on:event */}
            on:click={() => {
              console.log(`You clicked ${item}!`);
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};
mount(<App />, appendChild(document.body));
```

这样做只会给全局的`document`添加一个 click 的事件处理函数——只会调用一次`addEventHandler`。这个全局的事件处理函数会根据`event.composedPath()`获取到事件冒泡的整个链路，并依次调用元素上的处理函数。

但这种模式也有不好的地方——无论你点击哪个元素，都会调用一遍全局的事件处理函数，如果 DOM 树比较深，则每次点击都会遍历一次这些路径。关于如何进行取舍，也取决于用户。

### 条件渲染与列表渲染

现在，有了JSX，先前的`If/Show`与`For`的例子可以变得更清晰一些：

```tsx
import { mount } from "hyplate";
import { appendChild } from "hyplate/core";
import { Show } from "hyplate/directive";
import { enableBuiltinStore, source } from "hyplate/store";
import type { FC } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}

const Toggle: FC = () => {
  const show = source(false);
  const toggle = () => {
    show.set(!show.val);
  };
  return (
    <>
      <button onClick={toggle}>toggle</button>
      <Show when={show}>
        <span>I'm there!</span>
      </Show>
    </>
  );
};

mount(<Toggle />, appendChild(document.body));
```

```tsx
import { appendChild } from "hyplate/core";
import { For } from "hyplate/directive";
import { mount } from "hyplate/jsx-runtime";
import { enableBuiltinStore, source } from "hyplate/store";
import type { FC } from "hyplate/types";
enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}
interface CounterProps {
  msg: string;
}

const Counter: FC<CounterProps> = (props) => {
  const count = source(0);
  return (
    <button onClick={() => count.set(count.val + 1)}>
      Hello, {props.msg}! count = {count}
    </button>
  );
};

const App: FC = () => {
  let id = 0;
  const counterList = source<CounterProps[]>([]);
  const addCounterItem = () => {
    counterList.set(
      counterList.val.concat({
        msg: `counter${id++}`,
      })
    );
  };
  return (
    <div style="display: flex; flex-direction: column">
      <button onClick={addCounterItem}>add counter item</button>
      <For of={counterList}>{(props) => <Counter {...props} />}</For>
    </div>
  );
};

mount(<App />,appendChild(document.body));
```

或许你已经在委托模式的例子中注意到，静态的列表渲染可以不用`For`——如果列表不会变，那么直接通过`Array.prototype.map`创建会很棒！

```tsx
import { mount } from "hyplate";
import { appendChild } from "hyplate/core";
import { enableBuiltinStore } from "hyplate/store";
import type { FC } from "hyplate/types";
enableBuiltinStore();

const StaticList: FC = () => {
  const list = ["foo", "bar", "baz"];
  return (
    <ul>
      {list.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
};

mount(<StaticList />, appendChild(document.body));
```


## 类组件与 Web Components

`Hyplate`也有类组件，他们也是标准的 Web Component。类组件需要继承抽象类`Component`，而`Component`是`HTMLElement`的子类。

继承后需要实现`render()`方法，这个方法应当返回一个`Mountable`。`render()`方法的性质和函数组件一样——它只会在组件挂载时执行一次，不会因为组件的更新而被多次执行（不像`React`那样）。和函数组件不同的是，它没有参数接收`props`，而是通过`this.props`获取`props`。

同时，你需要进行一些配置，包括最重要的自定义元素的名称，才能正常使用他们。`Hyplate`提供两种方式进行配置。

目前配置的内容有：

- `tag`: 必须的字符串，它是自定义元素的名称。
- `shadowRootInit`: 可选的对象，它是调用`attachShadow()`时的配置，除了`mode`的值会被强制覆盖为`open`。
- `slotTag`: 可选的字符串，它是当`shadowRootInit.slotAssignment`为`"manual"`时，为插槽使用的包装元素。如果不指定，`Hyplate`将会生成一个标签，由`${tag}-slot`拼接而来，并为其注册一个匿名的 HTML 元素。
- `defaultProps`: 可选的对象，它是当`props`为空时使用的`props`。如果在 HTML 模板中使用 tag，构造函数收到的`props`将会是`undefined`，这个时候`defaultProps`就会派上用场。
- `observedAttributes`: 可选的数组，用于描述需要观察的属性。

### 使用装饰器

```tsx
import { appendChild } from "hyplate/core";
import { Component, mount } from "hyplate/jsx-runtime";
import { component } from "hyplate/toolkit";
@component({
  tag: "hyplate-app-demo1",
})
class App extends Component<{ msg: string }> {
  render() {
    return <div>Hello, {this.props.msg}!</div>;
  }
}
mount(<App msg="class component" />, appendChild(document.body));
```

TypeScript 的装饰器仍然是一个实验性的功能，在未来，ECMAScript 可能会有标准的语义，导致用户代码受到影响。目前，`Hyplate`的装饰器逻辑使用的是 TypeScript 的历史遗留实现。但好在装饰器`@component`只需要接收一个构造函数作为参数，因此使用装饰器的代码可以简单地转换成函数调用：

```tsx
import { appendChild } from "hyplate/core";
import { Component, mount } from "hyplate/jsx-runtime";
import { component } from "hyplate/toolkit";

class App extends Component<{ msg: string }> {
  render() {
    return <div>Hello, {this.props.msg}!</div>;
  }
}
component({
  tag: "hyplate-app-demo1",
})(App);

mount(<App msg="class component" />, appendChild(document.body));
```

### 使用静态字段

```tsx
import { appendChild } from "hyplate/core";
import { Component, mount } from "hyplate/jsx-runtime";

class App extends Component<{ msg: string }> {
  static tag = this.defineAs("hyplate-app-demo1");
  render() {
    return <div>Hello, {this.props.msg}!</div>;
  }
}
mount(<App msg="class component" />, appendChild(document.body));
```

目前，这种方法更加推荐，但要小心——需要确保`shadowRootInit.slotAssignment`与`slotTag`被设置后再执行`this.defineAs`。

此外，如果需要通过静态字段指定`observedAttributes`，你需要定义一个`getter`。这个静态字段需要与生命周期回调配合使用，后文会作介绍。

### 传递插槽

`Hyplate`的类组件也支持在 JSX 中使用，并且可以通过`props.children`传递插槽：

```tsx
import { appendChild } from "hyplate/core";
import { Component, mount } from "hyplate/jsx-runtime";

type AppSlotNames = "header" | "footer";
// 通过第二个泛型参数，可以指定插槽的名称
class App extends Component<{}, AppSlotNames> {
  static tag = this.defineAs("hyplate-app-demo2");
  render() {
    return (
      <div>
        <header>
          {/* this.slots将推导出这些名称 */}
          <slot name={this.slots.footer}></slot>
        </header>
        <footer>
          <slot name={this.slots.header}></slot>
        </footer>
      </div>
    );
  }
}
mount(
  <App>
    {{
      header: <div>I'm the header!</div>,
      footer: <div>I'm the footer!</div>,
    }}
  </App>,
  appendChild(document.body)
);
```

### 使用生命周期回调

目前，Web Components 规范中有四个生命周期回调：

```ts
export interface OnConnected {
  connectedCallback(): void;
}

export interface OnDisconnected {
  disconnectedCallback(): void;
}

export interface OnAdopted {
  adoptedCallback(): void;
}

export interface OnAttributeChanged {
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
}
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks
 */
export interface LifecycleCallbacks extends OnConnected, OnDisconnected, OnAdopted, OnAttributeChanged {}
```

`Hyplate`提供了生命周期回调的类型定义，你可以通过实现这些接口来定义生命周期，并检查回调名称的拼写。

```tsx
import { Component } from "hyplate/jsx-runtime";
import { OnConnected, OnDisconnected } from "hyplate/types";

class App extends Component implements OnConnected, OnDisconnected {
  static tag = this.defineAs("hyplate-app-demo3");
  render() {
    return <div>The web component!</div>;
  }
  connectedCallback(): void {
    // 默认情况下，组件不会自动`mount`与`render`，因为组件通常存在副作用，而这需要一个收集的作用域。
    // 如果希望在HTML模板中通过tag来使用这些组件，你需要在这个生命周期回调中调用`mount`方法。
    this.mount();
  }
  disconnectedCallback(): void {
    // 当然也别忘了在这个回调中调用卸载方法，用于清除可能的副作用。
    // 目前`Hyplate`并不自动做这些，是由于一些场景下需要支持临时将元素移出文档，但不进行组件销毁，实现临时隐藏元素的效果。
    this.unmount();
  }
}

const container = document.createElement("div");
document.body.appendChild(container);
container.innerHTML = `<hyplate-app-demo3></hyplate-app-demo3>`;
```

其中的`attributeChangedCallback`需要定义`observedAttributes`。

```tsx
import { appendChild } from "hyplate/core";
import { Component, mount } from "hyplate/jsx-runtime";
import { enableBuiltinStore, source } from "hyplate/store";
import { OnAttributeChanged } from "hyplate/types";
enableBuiltinStore();
class App extends Component implements OnAttributeChanged {
  static tag = this.defineAs("hyplate-app-demo1");
  static get observedAttributes(): string[] {
    return ["dir"];
  }
  render() {
    return (
      <p
        onClick={() => {
          dir.set(dir.val === "ltr" ? "rtl" : "ltr");
        }}
      >
        The direction of text will change when you click it!
      </p>
    );
  }
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    console.log(`${name} changed from ${oldValue} to ${newValue}!`);
  }
}

const dir = source("ltr");

mount(<App attr:id="the-id" attr:dir={dir} />, appendChild(document.body));
```

或许你注意到了`attr:id`与`attr:dir`，这两个以`attr:`开头的 JSX 属性不会作为`props`的一部分传递给组件，而是直接设置这个自定义元素的`attributes`的绑定。不过目前这样的设计还有待商榷——对于在`Hyplate`的 JSX 中使用这些属于 web component 的类组件是否应该使用`props`，还是仅使用纯粹的`attributes`，仍在设计当中。

上述例子中，没有在`observedAttributes`中返回的`id`属性的设置并不会触发`attributeChangedCallback`。
