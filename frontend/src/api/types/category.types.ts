export interface CategoryResponse {
    success: boolean;
    data: {
        category: CategoryData;
    }
}

export interface CategoryData {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

export interface CategoryInput {
    name: string;
}

//KATEGORİ
// {
//     "success": true,
//     "data": {
//         "category": {
//             "id": 1,
//             "name": "RPG Oyunları - Deneme Kategorisi",
//             "slug": "rpg-oyunlari-deneme-kategorisi",
//             "created_at": "2026-10-11 10:49:57",
//             "updated_at": "2026-10-11 10:49:57"
//         }
//     }
// }