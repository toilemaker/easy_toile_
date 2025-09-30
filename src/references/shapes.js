import { shapes } from '@joint/core';

const portRadius = 8;
const portAttrs = {
    circle: {
        cursor: 'crosshair',
        fill: '#4D64DD',
        stroke: '#F4F7F6',
        magnet: 'active',
        r: portRadius,
    },
};

export const Node = shapes.standard.Rectangle.define(
    'Node',
    {
        z: 2,
        attrs: {
            root: {
                highlighterSelector: 'body',
                magnetSelector: 'body',
            },
            body: {
                fill: 'rgba(70,101,229,0.15)',
                stroke: '#4665E5',
                strokeWidth: 1,
                rx: 2,
                ry: 2,
                filter: {
                    name: 'dropShadow',
                    args: {
                        dx: 2,
                        dy: 2,
                        blur: 3,
                        opacity: 0.2
                    }
                }
            },
            label: {
                text: '',
                fill: '#464454',
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'Arial, helvetica, sans-serif',
                y: 'calc(0.5*h)',
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                x: 'calc(0.5*w)'
            }
        },
        ports: {
            groups: {
                top: {
                    position: 'top',
                    attrs: portAttrs,
                },
                right: {
                    position: 'right',
                    attrs: portAttrs,
                },
                left: {
                    position: 'left',
                    attrs: portAttrs,
                },
            },
        },
    },
    null,
    {
        PORT_RADIUS: portRadius,
    }
);

export const Edge = shapes.standard.Link.define(
    'Edge',
    {
        z: 1,
        connector: {
            name: 'jumpover',
            args: {
                size: 15,
                jump: 'arc',
                radius: 5
            }
        },
        attrs: {
            line: {
                stroke: '#464454',
                strokeWidth: 2,
                targetMarker: { d: 'M 5 2.5 0 0 5 -2.5 Z' }
            },
        },
    }
);
