export interface BotGroup {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    createdAt?: string;
    updatedAt?: string;
    bots?: { id: string }[];
}
