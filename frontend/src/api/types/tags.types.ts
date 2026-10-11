export interface TagsResponse {
    success: boolean;
    data: {
        tag: TagsData;
    }
};

export interface TagsData {
    id: number;
    name: string;
    slug: string;
    created_at: string;
};

export interface TagsInput {
    name: string;
}

//TAGS
// {
//     "success": true,
//     "data": {
//         "tag": {
//             "id": 2,
//             "name": "BJK",
//             "slug": "bjk",
//             "created_at": "2026-10-11 10:55:33"
//         }
//     }
// }