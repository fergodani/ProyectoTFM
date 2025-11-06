export interface Post {
    id?: number;
    title: string;
    content: string;
    comments?: Comment[];
    author?: number;
    likes_count?: number;
    dislikes_count?: number;
    vote_score?: number;
    user_vote?: VoteType | null; // Voto del usuario actual
    plant_info?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Comment {
    id?: number;
    content: string;
    author: number;
    post: number;
    likes_count?: number;
    dislikes_count?: number;
    vote_score?: number;
    user_vote?: VoteType | null; // Voto del usuario actual
    created_at?: string;
    updated_at?: string;
}

// Tipos de voto disponibles
export type VoteType = 'like' | 'dislike';

// Acciones posibles al votar
export type VoteAction = 'created' | 'updated' | 'removed';

// Respuesta del servidor al votar en un post
export interface PostVoteResponse {
    action: VoteAction;
    vote_type: VoteType | null; // null cuando se remueve el voto
    vote_score: number;
    likes_count: number;
    dislikes_count: number;
}

// Respuesta del servidor al votar en un comentario
export interface CommentVoteResponse {
    action: VoteAction;
    vote_type: VoteType | null; // null cuando se remueve el voto
    vote_score: number;
    likes_count: number;
    dislikes_count: number;
    user_vote: VoteType | null; // Voto actual del usuario
}

// Request body para votar
export interface VoteRequest {
    vote_type: VoteType;
}

