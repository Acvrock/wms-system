# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WMS (Warehouse Management System) for managing headphone accessory inventory. The system is designed for e-commerce sellers who bundle various accessories (cables, DACs, cases, adapters) with headphones and need to track inventory, manage bundles, and plan restocking.

## Core Business Logic

### Data Model Hierarchy
- **配件 (Components)**: Base inventory items with price, image, name, description
- **套装 (Bundles)**: Collections of multiple components with their own metadata
- **补货计划 (Restocking Plans)**: Plans that consume inventory by specifying bundles and quantities

### Key Business Rules
- Restocking plans have two states: "打包中" (Packing) and "已打包" (Packed)
- Only "已打包" plans deduct inventory; "打包中" plans are drafts
- Inventory validation must occur before allowing plans to be saved
- Price visibility is role-dependent (BOSS sees all, 管理员 sees ***)

### Critical State Transitions
1. 补货计划 creation → inventory validation → state change to "打包中" or "已打包"
2. Inventory deduction only happens when plan moves to "已打包" state
3. Manual outbound records for damaged goods, loss, etc.

## Technical Architecture

### Deployment Requirements
- Offline standalone application accessible at http://localhost:3000
- Windows 10/11 compatible with .bat startup script
- No external dependencies for runtime

### User Roles & Authentication
- BOSS: Full access including price visibility and password management
- 管理员 (Manager): Limited access, prices shown as "***"
- Default passwords: "123456aa" for both roles

## Development Commands

- `npm run dev` - Start development server (concurrent backend + frontend)
- `npm run build` - Build frontend for production
- `npm start` - Start production server
- `npm run install:all` - Install all dependencies (backend + frontend)
- `start.bat` - Windows startup script for end users

## Testing Commands

- Backend API available at `http://localhost:3000/api`
- Frontend development server at `http://localhost:3001` (proxy to backend)
- Production build served at `http://localhost:3000`

## Core Features Implementation Priority

1. **配件管理** - Component CRUD with image upload
2. **套装管理** - Bundle creation with component associations
3. **库存验证引擎** - Real-time inventory checking for restocking plans
4. **补货计划状态机** - Draft/final state management with inventory deduction
5. **出库记录追踪** - Automatic and manual outbound tracking
6. **角色权限系统** - Price visibility and access control

## Database Schema Considerations

Key relationships:
- Components (1:N) → Bundle Components (N:1) → Bundles
- Bundles (1:N) → Restocking Plan Items (N:1) → Restocking Plans
- Components (1:N) → Outbound Records
- Restocking Plans (1:N) → Outbound Records (for automatic deductions)

## State Management Notes

Critical for handling:
- Real-time inventory calculations across multiple bundle configurations
- Optimistic updates with rollback for failed inventory validations
- Role-based data filtering for price visibility