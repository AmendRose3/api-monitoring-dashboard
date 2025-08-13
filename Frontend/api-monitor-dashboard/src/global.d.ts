declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.json' {
  const value: any;
  export default value;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
declare module '*.png' {
  const content: string;
  export default content;
}