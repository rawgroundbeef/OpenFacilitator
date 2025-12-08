import { Router, type Request, type Response, type IRouter } from 'express';
import { z } from 'zod';
import {
  createFacilitator,
  getFacilitatorById,
  getFacilitatorsByOwner,
  updateFacilitator,
  deleteFacilitator,
} from '../db/facilitators.js';
import { getTransactionsByFacilitator } from '../db/transactions.js';
import { defaultTokens } from '@openfacilitator/core';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router: IRouter = Router();

// Apply optional auth to all routes first to get user context
router.use(optionalAuth);

// Validation schemas
const createFacilitatorSchema = z.object({
  name: z.string().min(1).max(100),
  subdomain: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Invalid subdomain format'),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  supportedChains: z.array(z.number()).optional(),
  supportedTokens: z
    .array(
      z.object({
        address: z.string(),
        symbol: z.string(),
        decimals: z.number(),
        chainId: z.number(),
      })
    )
    .optional(),
});

const updateFacilitatorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  customDomain: z.string().max(255).optional().nullable(),
  supportedChains: z.array(z.number()).optional(),
  supportedTokens: z
    .array(
      z.object({
        address: z.string(),
        symbol: z.string(),
        decimals: z.number(),
        chainId: z.number(),
      })
    )
    .optional(),
});

/**
 * GET /api/admin/me - Get current user info
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  res.json({
    id: req.user!.id,
    email: req.user!.email,
    name: req.user!.name,
    emailVerified: req.user!.emailVerified,
    createdAt: req.user!.createdAt,
  });
});

/**
 * POST /api/admin/facilitators - Create a new facilitator
 */
router.post('/facilitators', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = createFacilitatorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
      return;
    }

    const { name, subdomain, supportedChains, supportedTokens } = parsed.data;
    // Use the authenticated user's ID as owner, or wallet address if provided
    const ownerAddress = parsed.data.ownerAddress || req.user!.id;

    // Default to Base Sepolia for testing
    const chains = supportedChains || [84532];
    const tokens = supportedTokens || defaultTokens.filter((t) => chains.includes(t.chainId));

    const facilitator = createFacilitator({
      name,
      subdomain,
      owner_address: ownerAddress,
      supported_chains: JSON.stringify(chains),
      supported_tokens: JSON.stringify(tokens),
    });

    if (!facilitator) {
      res.status(409).json({
        error: 'Subdomain already exists',
      });
      return;
    }

    res.status(201).json({
      id: facilitator.id,
      name: facilitator.name,
      subdomain: facilitator.subdomain,
      ownerAddress: facilitator.owner_address,
      supportedChains: JSON.parse(facilitator.supported_chains),
      supportedTokens: JSON.parse(facilitator.supported_tokens),
      url: `https://${facilitator.subdomain}.openfacilitator.io`,
      createdAt: facilitator.created_at,
    });
  } catch (error) {
    console.error('Create facilitator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/facilitators - List facilitators for the authenticated user
 */
router.get('/facilitators', requireAuth, async (req: Request, res: Response) => {
  try {
    // Use authenticated user's ID, or allow owner query param for backwards compatibility
    const ownerAddress = (req.query.owner as string) || req.user!.id;

    const facilitators = getFacilitatorsByOwner(ownerAddress);

    res.json(
      facilitators.map((f) => ({
        id: f.id,
        name: f.name,
        subdomain: f.subdomain,
        customDomain: f.custom_domain,
        ownerAddress: f.owner_address,
        supportedChains: JSON.parse(f.supported_chains),
        supportedTokens: JSON.parse(f.supported_tokens),
        url: f.custom_domain
          ? `https://${f.custom_domain}`
          : `https://${f.subdomain}.openfacilitator.io`,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      }))
    );
  } catch (error) {
    console.error('List facilitators error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/facilitators/:id - Get a specific facilitator
 */
router.get('/facilitators/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const facilitator = getFacilitatorById(req.params.id);
    if (!facilitator) {
      res.status(404).json({ error: 'Facilitator not found' });
      return;
    }

    res.json({
      id: facilitator.id,
      name: facilitator.name,
      subdomain: facilitator.subdomain,
      customDomain: facilitator.custom_domain,
      ownerAddress: facilitator.owner_address,
      supportedChains: JSON.parse(facilitator.supported_chains),
      supportedTokens: JSON.parse(facilitator.supported_tokens),
      url: facilitator.custom_domain
        ? `https://${facilitator.custom_domain}`
        : `https://${facilitator.subdomain}.openfacilitator.io`,
      createdAt: facilitator.created_at,
      updatedAt: facilitator.updated_at,
    });
  } catch (error) {
    console.error('Get facilitator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/facilitators/:id - Update a facilitator
 */
router.patch('/facilitators/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = updateFacilitatorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
      return;
    }

    const updates: Record<string, string> = {};
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.customDomain !== undefined) {
      updates.custom_domain = parsed.data.customDomain || '';
    }
    if (parsed.data.supportedChains) {
      updates.supported_chains = JSON.stringify(parsed.data.supportedChains);
    }
    if (parsed.data.supportedTokens) {
      updates.supported_tokens = JSON.stringify(parsed.data.supportedTokens);
    }

    const facilitator = updateFacilitator(req.params.id, updates);
    if (!facilitator) {
      res.status(404).json({ error: 'Facilitator not found' });
      return;
    }

    res.json({
      id: facilitator.id,
      name: facilitator.name,
      subdomain: facilitator.subdomain,
      customDomain: facilitator.custom_domain,
      ownerAddress: facilitator.owner_address,
      supportedChains: JSON.parse(facilitator.supported_chains),
      supportedTokens: JSON.parse(facilitator.supported_tokens),
      url: facilitator.custom_domain
        ? `https://${facilitator.custom_domain}`
        : `https://${facilitator.subdomain}.openfacilitator.io`,
      createdAt: facilitator.created_at,
      updatedAt: facilitator.updated_at,
    });
  } catch (error) {
    console.error('Update facilitator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/facilitators/:id - Delete a facilitator
 */
router.delete('/facilitators/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const deleted = deleteFacilitator(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Facilitator not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete facilitator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/facilitators/:id/transactions - Get transaction history
 */
router.get('/facilitators/:id/transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const facilitator = getFacilitatorById(req.params.id);
    if (!facilitator) {
      res.status(404).json({ error: 'Facilitator not found' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = getTransactionsByFacilitator(req.params.id, limit, offset);

    res.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        network: t.network,
        fromAddress: t.from_address,
        toAddress: t.to_address,
        amount: t.amount,
        asset: t.asset,
        transactionHash: t.transaction_hash,
        status: t.status,
        errorMessage: t.error_message,
        createdAt: t.created_at,
      })),
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/facilitators/:id/export - Generate self-host config
 */
router.post('/facilitators/:id/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const facilitator = getFacilitatorById(req.params.id);
    if (!facilitator) {
      res.status(404).json({ error: 'Facilitator not found' });
      return;
    }

    // Generate Docker Compose configuration for self-hosting
    const dockerCompose = `version: '3.8'

services:
  openfacilitator:
    image: ghcr.io/rawgroundbeef/openfacilitator:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - FACILITATOR_NAME=${facilitator.name}
      - FACILITATOR_SUBDOMAIN=${facilitator.subdomain}
      - OWNER_ADDRESS=${facilitator.owner_address}
      - SUPPORTED_CHAINS=${facilitator.supported_chains}
      - DATABASE_PATH=/data/openfacilitator.db
    volumes:
      - openfacilitator-data:/data
    restart: unless-stopped

volumes:
  openfacilitator-data:
`;

    const envFile = `# OpenFacilitator Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Facilitator Settings
FACILITATOR_NAME="${facilitator.name}"
FACILITATOR_SUBDOMAIN="${facilitator.subdomain}"
OWNER_ADDRESS="${facilitator.owner_address}"
SUPPORTED_CHAINS='${facilitator.supported_chains}'
SUPPORTED_TOKENS='${facilitator.supported_tokens}'

# Database
DATABASE_PATH=./data/openfacilitator.db

# Optional: Custom RPC endpoints
# BASE_RPC_URL=https://mainnet.base.org
# BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
`;

    res.json({
      dockerCompose,
      envFile,
      instructions: `
# Self-hosting Instructions

1. Save the docker-compose.yml file
2. Save the .env file in the same directory
3. Run: docker compose up -d
4. Your facilitator will be available at http://localhost:3001

For production:
- Set up a reverse proxy (nginx, caddy) with SSL
- Point your domain to the server
- Update the HOST environment variable
      `.trim(),
    });
  } catch (error) {
    console.error('Export facilitator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as adminRouter };

