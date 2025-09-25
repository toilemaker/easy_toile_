declare module 'gojs' {
  export = go;
  export as namespace go;
  
  namespace go {
    class GraphObject {
      static make(...args: any[]): any;
    }
    
    class Diagram {
      constructor(div: HTMLElement | string, options?: any);
      div: HTMLElement | null;
      model: Model;
      nodeTemplate: any;
      linkTemplate: any;
      layout: any;
      undoManager: any;
      animationManager: any;
      allowCopy: boolean;
      allowDelete: boolean;
      allowMove: boolean;
      hasHorizontalScrollbar: boolean;
      hasVerticalScrollbar: boolean;
      contentAlignment: any;
    }
    
    class Node {
      static Auto: string;
    }
    
    class Link {
      static AvoidsNodes: any;
      static JumpGap: any;
    }
    
    class Shape {
      constructor(figure?: string);
    }
    
    class TextBlock {
      static WrapFit: any;
    }
    
    class Point {
      constructor(x: number, y: number);
      static parse(str: string): Point;
      static stringify(point: Point): string;
    }
    
    class Size {
      constructor(width: number, height: number);
    }
    
    class Spot {
      static Center: Spot;
      static AllSides: Spot;
    }
    
    class Binding {
      constructor(target: string, source?: string, converter?: Function);
      makeTwoWay(converter?: Function): Binding;
    }
    
    class Model {
      constructor(nodeDataArray?: any[], linkDataArray?: any[]);
    }
    
    class GraphLinksModel extends Model {
      constructor(nodeDataArray?: any[], linkDataArray?: any[]);
    }
    
    class LayeredDigraphLayout {
      constructor(options?: any);
      direction: number;
      layerSpacing: number;
      columnSpacing: number;
      setsPortSpots: boolean;
    }
    
    class Adornment {
      static Auto: string;
    }
  }
}
