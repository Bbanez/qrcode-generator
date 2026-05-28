import { SimpleLinearFn } from '../math/simple_linear_fn';
import { Vec2 } from '../math/vec2';

export class GridTransform {
    inSize: Vec2;
    outSize: Vec2;
    tfn: {
        x: SimpleLinearFn;
        y: SimpleLinearFn;
    };

    constructor(inSize: Vec2, outSize: Vec2) {
        this.inSize = inSize;
        this.outSize = outSize;
        this.tfn = {
            x: new SimpleLinearFn(
                new Vec2(0, 0),
                new Vec2(inSize.x, outSize.x),
            ),
            y: new SimpleLinearFn(
                new Vec2(0, 0),
                new Vec2(inSize.y, outSize.y),
            ),
        };
    }

    out(inPoint: Vec2): [tl: Vec2, br: Vec2] {
        return [
            new Vec2(this.tfn.x.cal(inPoint.x), this.tfn.y.cal(inPoint.y)),
            new Vec2(
                this.tfn.x.cal(inPoint.x + 1),
                this.tfn.y.cal(inPoint.y + 1),
            ),
        ];
    }
}
