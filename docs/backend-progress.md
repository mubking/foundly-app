# Foundly Backend Progress

Last Updated: 2026-08-03

## ✅ Completed APIs

### Authentication
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] GET /api/auth/me

### Users
- [x] GET /api/users/profile
- [x] PATCH /api/users/profile

### Items
- [x] POST /api/items/lost
- [x] POST /api/items/found
- [x] GET /api/items/search
- [x] GET /api/items/:id
- [x] GET /api/items/mine/lost
- [x] GET /api/items/mine/found

### Claims
- [x] POST /api/claims/create
- [x] POST /api/claims/verify
- [x] PATCH /api/claims/:id/status
- [x] GET /api/claims/mine

### Notifications
- [x] GET /api/notifications
- [x] PATCH /api/notifications/:id/read

### Uploads
- [x] POST /api/upload/image

### Chat
- [x] Conversations API
- [x] Messages API

### Admin
- [x] Dashboard
- [x] Users
- [x] Reports

---

## 🚧 Current Task

None

---

## ⏳ Remaining APIs (MVP)

### Items
- [ ] PATCH /api/items/:id
- [ ] DELETE /api/items/:id

### Notifications
- [ ] PATCH /api/notifications/read-all
- [ ] DELETE /api/notifications/:id
- [ ] DELETE /api/notifications

### Authentication
- [ ] POST /api/auth/forgot-password
- [ ] POST /api/auth/reset-password
- [ ] POST /api/auth/change-password

### Claims (Review)
- [ ] Decide whether GET /api/claims/:id is needed
- [ ] Decide whether GET /api/items/:id/claims is needed

### Push Notifications
- [ ] Register device token
- [ ] Remove device token

---

## 🧪 Testing Status

- [x] Authentication
- [x] Items
- [x] Claims
- [x] Notifications
- [x] Uploads
- [x] Chat
- [x] Profile
- [x] Admin

---

## 📌 Next Endpoint

PATCH /api/items/:id
