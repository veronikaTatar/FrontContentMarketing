// src/pages/Tasks/types.ts

export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'пустой': return 'secondary';
        case 'в процессе': return 'warning';
        case 'на проверке': return 'info';
        case 'отклонен': return 'danger';
        case 'одобрен': return 'success';
        case 'удален': return 'secondary';
        default: return 'secondary';
    }
};

export const getPriorityColor = (priority: number): string => {
    if (priority <= 1) return 'success';
    if (priority <= 3) return 'warning';
    return 'danger';
};

export const parseBrief = (brief: string) => {
    const result = { topic: '—', goal: '—', kpi: [] as string[] };
    if (!brief) return result;

    const topicMatch = brief.match(/Тематика:\s*([^|]+)/);
    if (topicMatch) result.topic = topicMatch[1].trim();

    const goalMatch = brief.match(/Цель:\s*([^|]+)/);
    if (goalMatch) result.goal = goalMatch[1].trim();

    const kpiMatch = brief.match(/KPI:\s*([^|]+)/);
    if (kpiMatch) {
        const kpiItems = kpiMatch[1].trim().split(',').map(item => item.trim());
        result.kpi = kpiItems.map(item => {
            if (item.includes('лайки')) return item.replace('лайки≥', '👍 ');
            if (item.includes('просмотры')) return item.replace('просмотры≥', '👁 ');
            if (item.includes('репосты')) return item.replace('репосты≥', '🔄 ');
            if (item.includes('комментарии')) return item.replace('комментарии≥', '💬 ');
            return item;
        });
    }
    return result;
};

export const topics = [
    'Новости', 'Спорт', 'Бизнес', 'Технологии', 'Образование',
    'Здоровье', 'Развлечения', 'Путешествия', 'Наука', 'Искусство', 'Другое'
];

export const tagOptions = [
    'Контент', 'SMM', 'Реклама', 'Продажи', 'Таргет',
    'Фриланс', 'Сайты', 'SEO', 'Маркетинг', 'Релиз'
];

export interface BriefData {
    goal: string; goalOther: string; audience: string; audienceOther: string;
    tone: string; toneOther: string; keyTheses: string; language: string;
    languageMixed: string; mediaType: string; mediaCount: string;
    productLink: string; topic: string; topicOther: string;
}

export interface KpiData {
    targetLikes: number; targetViews: number;
    targetReposts: number; targetComments: number;
}

export const initialBrief: BriefData = {
    goal: '', goalOther: '', audience: '', audienceOther: '',
    tone: '', toneOther: '', keyTheses: '', language: '',
    languageMixed: '', mediaType: '', mediaCount: '', productLink: '', topic: '', topicOther: ''
};

// Функция для парсинга brief обратно в форму
export const parseBriefToForm = (brief: string): { brief: BriefData; kpi: KpiData } => {
    const result = {
        brief: { ...initialBrief },
        kpi: { ...initialKpi }
    };

    if (!brief) return result;

    // Парсим тематику
    const topicMatch = brief.match(/Тематика:\s*([^|]+)/);
    if (topicMatch) {
        const topicValue = topicMatch[1].trim();
        if (topicValue.startsWith('другое:')) {
            result.brief.topic = 'Другое';
            result.brief.topicOther = topicValue.replace('другое:', '').trim();
        } else {
            result.brief.topic = topicValue;
        }
    }

    // Парсим цель
    const goalMatch = brief.match(/Цель:\s*([^|]+)/);
    if (goalMatch) {
        const goalValue = goalMatch[1].trim();
        if (goalValue.startsWith('другое:')) {
            result.brief.goal = 'other';
            result.brief.goalOther = goalValue.replace('другое:', '').trim();
        } else {
            result.brief.goal = goalValue;
        }
    }

    // Парсим аудиторию
    const audienceMatch = brief.match(/Аудитория:\s*([^|]+)/);
    if (audienceMatch) {
        const audienceValue = audienceMatch[1].trim();
        if (audienceValue.startsWith('другое:')) {
            result.brief.audience = 'other';
            result.brief.audienceOther = audienceValue.replace('другое:', '').trim();
        } else {
            result.brief.audience = audienceValue;
        }
    }

    // Парсим тон
    const toneMatch = brief.match(/Тон:\s*([^|]+)/);
    if (toneMatch) {
        const toneValue = toneMatch[1].trim();
        if (toneValue.startsWith('другое:')) {
            result.brief.tone = 'other';
            result.brief.toneOther = toneValue.replace('другое:', '').trim();
        } else {
            result.brief.tone = toneValue;
        }
    }

    // Парсим теги (ВНИМАНИЕ: здесь должно быть "Теги:", а не "Тезисы:")
    const tagsMatch = brief.match(/Теги:\s*([^|]+)/);
    if (tagsMatch) {
        result.brief.keyTheses = tagsMatch[1].trim();
    }

    // Парсим язык
    const languageMatch = brief.match(/Язык:\s*([^|]+)/);
    if (languageMatch) {
        const languageValue = languageMatch[1].trim();
        if (languageValue.startsWith('смешанный:')) {
            result.brief.language = 'mixed';
            result.brief.languageMixed = languageValue.replace('смешанный:', '').trim();
        } else {
            result.brief.language = languageValue;
        }
    }

    // Парсим медиа
    const mediaMatch = brief.match(/Медиа:\s*([^,]+),?\s*кол-во:\s*(\d+)/);
    if (mediaMatch) {
        result.brief.mediaType = mediaMatch[1].trim();
        result.brief.mediaCount = mediaMatch[2].trim();
    } else {
        const mediaOnlyMatch = brief.match(/Медиа:\s*([^|]+)/);
        if (mediaOnlyMatch) {
            result.brief.mediaType = mediaOnlyMatch[1].trim();
        }
    }

    // Парсим ссылку
    const linkMatch = brief.match(/Ссылка:\s*([^|]+)/);
    if (linkMatch) {
        result.brief.productLink = linkMatch[1].trim();
    }

    // Парсим KPI
    const kpiMatch = brief.match(/KPI:\s*([^|]+)/);
    if (kpiMatch) {
        const kpiString = kpiMatch[1].trim();

        const likesMatch = kpiString.match(/лайки≥(\d+)/);
        if (likesMatch) result.kpi.targetLikes = parseInt(likesMatch[1]);

        const viewsMatch = kpiString.match(/просмотры≥(\d+)/);
        if (viewsMatch) result.kpi.targetViews = parseInt(viewsMatch[1]);

        const repostsMatch = kpiString.match(/репосты≥(\d+)/);
        if (repostsMatch) result.kpi.targetReposts = parseInt(repostsMatch[1]);

        const commentsMatch = kpiString.match(/комментарии≥(\d+)/);
        if (commentsMatch) result.kpi.targetComments = parseInt(commentsMatch[1]);
    }

    return result;
};

export const initialKpi: KpiData = { targetLikes: 0, targetViews: 0, targetReposts: 0, targetComments: 0 };

export const formatBrief = (brief: BriefData, kpi: KpiData): string => {
    const parts: string[] = [];
    const topicText = brief.topic === 'Другое' ? `другое: ${brief.topicOther}` : brief.topic;
    if (topicText) parts.push(`Тематика: ${topicText}`);
    const goalText = brief.goal === 'other' ? `другое: ${brief.goalOther}` : brief.goal;
    if (goalText) parts.push(`Цель: ${goalText}`);
    const audienceText = brief.audience === 'other' ? `другое: ${brief.audienceOther}` : brief.audience;
    if (audienceText) parts.push(`Аудитория: ${audienceText}`);
    const toneText = brief.tone === 'other' ? `другое: ${brief.toneOther}` : brief.tone;
    if (toneText) parts.push(`Тон: ${toneText}`);
    if (brief.keyTheses) {
        parts.push(`Теги: ${brief.keyTheses}`);
    }
    let languageText = brief.language;
    if (brief.language === 'mixed' && brief.languageMixed) languageText = `смешанный: ${brief.languageMixed}`;
    if (languageText) parts.push(`Язык: ${languageText}`);
    if (brief.mediaType && brief.mediaCount) parts.push(`Медиа: ${brief.mediaType}, кол-во: ${brief.mediaCount}`);
    else if (brief.mediaType) parts.push(`Медиа: ${brief.mediaType}`);
    if (brief.productLink) parts.push(`Ссылка: ${brief.productLink}`);
    const kpiParts: string[] = [];
    if (kpi.targetLikes > 0) kpiParts.push(`лайки≥${kpi.targetLikes}`);
    if (kpi.targetViews > 0) kpiParts.push(`просмотры≥${kpi.targetViews}`);
    if (kpi.targetReposts > 0) kpiParts.push(`репосты≥${kpi.targetReposts}`);
    if (kpi.targetComments > 0) kpiParts.push(`комментарии≥${kpi.targetComments}`);
    if (kpiParts.length > 0) parts.push(`KPI: ${kpiParts.join(', ')}`);
    return parts.length > 0 ? parts.join(' | ') : '—';
};

interface BriefInfo {
    topic: string;
    goal: string;
    kpi?: string[];  // Сделать опциональным
    requiredImagesCount: number;
    description: string;
    targetAudience: string;
    style: string;
    language: string;
    mediaFormat: string;
    mandatoryTags: string[];
    additionalRequirements: string;
}
// ГЛАВНОЕ ИСПРАВЛЕНИЕ - ищем "Теги:" а не "Тезисы:"
export const parseFullBrief = (brief: string | undefined | null): BriefInfo => {
    if (!brief) {
        return {
            topic: 'Не указано',
            goal: 'Не указано',
            requiredImagesCount: 1,
            mandatoryTags: [],
            targetAudience: 'Не указано',
            style: 'Не указан',
            language: 'Русский',
            mediaFormat: 'JPG/PNG',
            kpi: [],
            description: '',
            additionalRequirements: 'Нет'
        };
    }

    const topicMatch = brief.match(/Тематика:\s*([^|\n]+)/i);
    const goalMatch = brief.match(/Цель:\s*([^|\n]+)/i);
    const audienceMatch = brief.match(/Аудитория:\s*([^|\n]+)/i);
    const toneMatch = brief.match(/Тон:\s*([^|\n]+)/i);
    const languageMatch = brief.match(/Язык:\s*([^|\n]+)/i);
    const mediaMatch = brief.match(/Медиа:\s*([^|,\n]+)/i);
    const imagesCountMatch = brief.match(/кол-во:\s*(\d+)/i);

    // ВАЖНО: Ищем "Теги:" (с заглавной) или "теги:" (с маленькой)
    let mandatoryTags: string[] = [];

    // Вариант 1: Теги:
    let tagsMatch = brief.match(/Теги:\s*([^|\n]+)/i);
    if (!tagsMatch) {
        // Вариант 2: теги:
        tagsMatch = brief.match(/теги:\s*([^|\n]+)/i);
    }
    if (!tagsMatch) {
        // Вариант 3: Тезисы:
        tagsMatch = brief.match(/Тезисы:\s*([^|\n]+)/i);
    }

    if (tagsMatch && tagsMatch[1]) {
        mandatoryTags = tagsMatch[1]
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0);
    }

    // Парсим KPI
    const kpiPattern = /(лайки|просмотры|репосты|комментарии)\s*[≥>=]\s*(\d+)/gi;
    const kpi: string[] = [];
    let match;
    while ((match = kpiPattern.exec(brief)) !== null) {
        kpi.push(`${match[1]} ≥ ${match[2]}`);
    }

    console.log('parseFullBrief result:', {
        topic: topicMatch ? topicMatch[1].trim() : 'Не указано',
        goal: goalMatch ? goalMatch[1].trim() : 'Не указано',
        mandatoryTags: mandatoryTags,
        requiredImagesCount: imagesCountMatch ? parseInt(imagesCountMatch[1]) : 1
    });

    return {
        topic: topicMatch ? topicMatch[1].trim() : 'Не указано',
        goal: goalMatch ? goalMatch[1].trim() : 'Не указано',
        targetAudience: audienceMatch ? audienceMatch[1].trim() : 'Не указано',
        style: toneMatch ? toneMatch[1].trim() : 'Не указан',
        language: languageMatch ? languageMatch[1].trim() : 'Русский',
        mediaFormat: mediaMatch ? mediaMatch[1].trim() : 'JPG/PNG',
        requiredImagesCount: imagesCountMatch ? parseInt(imagesCountMatch[1]) : 1,
        mandatoryTags: mandatoryTags,
        kpi: kpi,
        description: '',
        additionalRequirements: 'Нет'
    };
};