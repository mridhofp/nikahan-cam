export type GuestPhoto = {
  id: string;
  guest_id: string;
  guest_name: string;
  photo_url: string;
  created_at: string;
};

export type Album = {
  guestId: string;
  guestName: string;
  photos: GuestPhoto[];
  coverUrl: string;
  isMine: boolean;
};

export type LocalShot = {
  id: string;
  url: string;
  createdAt: string;
};
