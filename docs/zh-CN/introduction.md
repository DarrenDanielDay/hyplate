# 概览

## 动机

随着 Web 技术的发展，网页应用程序的功能越来越复杂，开发者们也编写了大量的 JavaScript 代码。为了实现组件化、模块化开发，大量的 JavaScript 框架也应运而生，各自也日渐繁荣着社区的生态，从工具链到组件库，乃至整个网站的解决方案。

然而，一些社区生态可能仅限于几个特定的开发框架，或者只有使用特定框架才能获得最佳体验——例如著名的 Material Design，最受欢迎的是`React`的版本。一些小众的框架，或者说还没有流行起来的框架，想要复用这些生态就会遇到困难——除非引入其他框架的必要运行时代码，但这会带来额外的加载负担。

于是，**Web Components**应运而生，也就是 Web 的标准组件化方案。这样一来，在几乎所有的前端框架之下都能复用到这些组件，并能将差异化降到最低。

但是，**Web Components**的开发也并非易事。**Web Components**的 HTML 元素通常通过`HTMLTemplateElement`的`content`进行构建，而这些模板元素，为了保证组件独立可用，必须通过脚本来创建——组件库的代码不能认为这些`HTMLTemplateElement`存在于文档中。如果使用现有的 JavaScript 框架去构建**Web Components**使用的模板或 HTML 元素，便又回到了引入框架必要运行时代码的问题。

于是，近年来也有不少专为**Web Components**开发而设计的框架诞生，例如`Lit`——拥有轻量的运行时与 HTML 模板解析功能。但是`Lit`用于构建 HTML 部分的方案是模板字符——这将导致你必须在 JavaScript 代码中编写 HTML：

```js
import { LitElement, css, html } from "lit";
export class SimpleGreeting extends LitElement {
  constructor() {
    super();
    this.name = "World";
  }
  render() {
    // 模板在这里编写
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
customElements.define("simple-greeting", SimpleGreeting);
```

尽管这样做有利于为模板元素添加动态特性与交互能力，但这将导致模板无法脱离组件进行单独维护——倘若希望通过视觉设计工具进行模板的开发，让界面部分真正交付于界面设计师，模板内则不应当包含任何 JavaScript 逻辑代码。

是否有更直接的组合方式，使得组件之间能复用界面模板的代码？

参考 Angular 的 HTML 模板与模板变量，一个点子冒了出来——通过将 HTML 文件转换成 ES Module，并导出模板作为一个变量，实现在 JavaScript 内引入 HTML 元素，并能够天然地使用 JavaScript 进行拼装组合。

```html
<!-- foo.html -->
<!-- 使用#的语法声明命名导出 -->
<!-- export { theTemplateElement as hello } -->
<template #hello> Hello, </template>

<!-- 无变量声明时，作为默认导出 -->
<!-- export default theTemplateElement -->
<template> world! </template>
```

```js
// 在JavaScript代码中使用
import { hello, default as world } from "./foo.html";
// 导入的hello和world是HTMLTemlplateElement的实例
document.body.append(hello.content.cloneNode(true), world.content.cloneNode(true));
```

当然，上述代码并不能直接在`Hyplate`中使用，为了省去那些重复的繁琐操作（例如`cloneNode`），`Hyplate`还对模板做了一些额外的封装处理，这些代码仅仅是主要的灵感。个人创造`Hyplate`的一个目的，也是希望 ECMAScript 能有类似的导入`HTML`片段的标准产生。现在的`chromium`浏览器已经有了`import assertion`和`JSON module`的支持，可以直接将`JSON`文件导入到`module`中使用，或许支持直接导入 HTML 的特性，让 HTML 元素更容易组合也并不遥远。目前已有[HTML Module](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/html-modules-explainer.md)的提案，但那会创建一个全新的文档，尽管这有利于保证内部的脚本在沙盒中执行，但可能不利于加载性能。`Hyplate`做出的尝试，正是将 HTML 片段通过 HTML 模板文件进行组合——这也是`Hyplate`名称的由来：`hyper` + `template`。

有了组合 HTML 模板的能力，剩下的就是通过 JavaScript 构建页面中动态的部分。随着 DOM 标准的完善，许多操作都有直接的 JavaScript API——开发者可以使用更加简单的`VanillaJS`代码去编写元素的操作逻辑。`Hyplate`也提供了一些方法去帮助做一些比较无聊的`VanillaJS`操作：获取 DOM、插入文本、设置元素属性、添加/移除事件侦听器等等。这也是`Hyplate`的第二个目的：帮助完成开发中相对无聊的`VanillaJS`操作。

## 进一步

除了帮助完成一些常见`VanillaJS`操作，`Hyplate`也尝试提升开发体验。对于构建具有大量动态特性的视图，`Hyplate`提供了 JSX——这使得一些`Hyplate`的代码看起来很像`React`：

```jsx
import { mount, appendChild, $ } from "hyplate";
function App(props) {
  return (
    <div>
      <p>Hello, {props.msg}</p>
      <button
        onClick={() => {
          console.log("You clicked the button!");
        }}
      >
        click me
      </button>
    </div>
  );
}
mount(<App msg="world" />, appendChild($("div#app")));
```

但是`Hyplate`的 JSX 与`React`的 JSX 在设计上有非常大的不同：`Hyplate`没有虚拟 DOM，绝大多数API的操作会直接反映到DOM上，函数组件也只会在创建时执行一次。这看起来和`SolidJS`有点相似，但是`Hyplate`保留了`React`的 JSX 转换方式——你可以直接使用任何现有的 JSX 编译工具将 JSX 转换成 JavaScript 代码，而无需使用特定的编译器（`SolidJS`的 JSX 需要通过`babel-plugin-jsx-dom-expressions`转换）。

还有一些常见需要，诸如数据绑定、样式隔离、条件渲染、列表渲染等等，`Hyplate`也做出了相应的尝试。
