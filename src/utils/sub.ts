import { createId } from '@paralleldrive/cuid2';

export class Sub {
    private items: Array<{
        id: string;
        callback: () => void;
    }> = [];

    trigger(): void {
        for (let i = 0; i < this.items.length; i++) {
            this.items[i].callback();
        }
    }

    subscribe(callback: () => void): () => void {
        const id = createId();
        this.items.push({ id, callback });
        return () => {
            for (let i = 0; i < this.items.length; i++) {
                if (this.items[i].id !== id) {
                    continue;
                }
                this.items.splice(i, 1);
                break;
            }
        };
    }
}
