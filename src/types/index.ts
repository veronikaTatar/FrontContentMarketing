/*Это TypeScript интерфейсы — "ДЖЕНЕРИКИ" для TypeScript
* Где используется:

    После входа в систему

    При показе профиля

    Для проверки прав доступа TypeScript сам проверит что вы не ошиблись с полями
* */
export type Role = 'ADMIN' | 'MANAGER' | 'AUTHOR';

export interface LoginCredentials {
    login?: string;
    email?: string;
    password: string;
}

export interface RegisterData {
    login: string;
    email: string;
    password: string;
    fullName: string;
    role: Role;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    role: Role;
    fullName: string;
    email: string;
}

export interface User {
    email: string;
    fullName: string;
    role: Role;
}

export interface UserOption {
    idUser: number;
    fullName: string;
    email: string;
}



export interface Task {
    idTask: number;
    title: string;
    brief: string;
    status: string;
    priority: number;
    deadlineAt: string | null;
    createdAt: string;
    idUser: number;
    assigneeName: string;
    assigneeEmail: string;
    // Добавляем KPI
    targetLikes: number;
    targetViews: number;
    targetReposts: number;
    targetComments: number;
}

export interface TaskDraft {
    idTaskDraft: number;
    header: string;
    body: string;
    version: number;
    comment: string;
    idTask: number;
    tags: string[];
    imageUrls: string[];
    createdAt: string;
}

export interface Tag {
    idTag: number;
    name: string;
    category: string;
}



export interface NotificationItem {
    idNotification: number;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface Content {
    idContent: number;
    title: string;
    body: string;
    status: string;
    idUser: number;
    idTask?: number | null;
    tags: string[];
}

export interface Post {
    idPost: number;
    idDraftTask: number;
    idChannel: number;
    status: string;
    scheduledAt: string | null;
    publishedAt: string | null;
    channelName?: string;
    draftTitle?: string;
}

export interface Channel {
    idChannel: number;
    name: string;
    platform: string;
    isActive: boolean;
    externalId?: string;
    accessToken?: string;
    subscribersCount?: number;
}

// Добавить в src/types/index.ts
export interface Publication {
    idPublication: number;
    idContent?: number;
    idTask: number;
    idChannel: number;
    status: string;
    scheduledAt?: string | null;
    publishedAt?: string | null;
    title?: string;
}

export interface PublicationReport {
    idPublication: number;
    contentTitle: string;
    channelName: string;
    publishedAt?: string | null;
    likes: number;
    views: number;
    reposts: number;
    comments: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}


export interface Tag {
    idTag: number;
    name: string;
    category: string;
}

// src/types/index.ts - убедитесь, что типы определены
export interface KPI {
    targetLikes: number;
    targetViews: number;
    targetReposts: number;
    targetComments: number;
}




//аналитика

// Добавить типы

export interface ActualKPI {
    likesCount: number;
    viewsCount: number;
    repostsCount: number;
    commentsCount: number;
}

export interface ChannelInfo {
    postId: number;
    channelId: number;
    channelName: string;
    platform: string;
    publishedAt: string | null;
    subscribersCount: number;
}

export interface GroupedPost {
    draftId: number;
    header: string;
    channels: ChannelInfo[];
    totalActualKPI: ActualKPI;
    hasAnalytics: boolean;
}

export interface PostAnalytics {
    idPostAnalytics: number;
    idPost: number;
    analyticsAt: string;
    actualKPI: ActualKPI;
    notes: string | null;
    achievement: {
        likesPercent: number;
        viewsPercent: number;
        repostsPercent: number;
        commentsPercent: number;
        overallPercent: number;
    };
}

export interface TaskPerformance {
    taskId: number;
    totalActual: {
        targetLikes: number;
        targetViews: number;
        targetReposts: number;
        targetComments: number;
    };
    desiredKPI: {
        targetLikes: number;
        targetViews: number;
        targetReposts: number;
        targetComments: number;
    };
    achievement: {
        likesPercent: number;
        viewsPercent: number;
        repostsPercent: number;
        commentsPercent: number;
        overallPercent: number;
    };
    postsCount: number;
}



