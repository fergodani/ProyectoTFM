export interface Post {
    id: number;
    title: string;
    content: string;
    comments: Comment[];
    author: string;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    id: number;
    content: string;
    author: string;
    created_at: string;
    updated_at: string;
}