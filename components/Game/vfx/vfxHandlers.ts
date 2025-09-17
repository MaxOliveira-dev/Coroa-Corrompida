import type { VisualEffectsManager } from '../VisualEffectsManager';
import type { UpdateResult } from '../entityInterfaces';
import * as vfx from './index';
import type { HeroEntity } from '../entities/HeroEntity';

type VfxPayload = NonNullable<UpdateResult['newVfx']>;
type VfxHandler = (vfxManager: VisualEffectsManager, payload: VfxPayload) => void;

export const vfxHandlers: { [key in VfxPayload['type']]?: VfxHandler } = {
    'ACORDE_DISSONANTE': (vfxManager, { target }) => {
        if (target) vfx.showAcordeDissonante(vfxManager, target);
    },
    'MELODIA_SERENA': (vfxManager, { caster, targets }) => {
        if (caster && targets) vfx.showMelodiaSerena(vfxManager, caster, targets);
    },
    'BALAUSTRADA_HARMONICA': (vfxManager, { targets }) => {
        if (targets) vfx.showBalaustradaHarmonica(vfxManager, targets);
    },
    'INICIO_DA_COMPOSICAO': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showInicioDaComposicao(vfxManager, target, duration);
    },
    'BARD_COMPOSITION_FINALE': (vfxManager, { target, comboColors }) => {
        if (target && comboColors) vfx.showBardCompositionFinale(vfxManager, target, comboColors);
    },
    'VENOM_PUDDLE': (vfxManager, { x, y, radius, duration }) => {
        if (x !== undefined && y !== undefined && radius && duration) vfx.showVenomPuddle(vfxManager, x, y, radius, duration);
    },
    'SOCO_SERIO_HIT': (vfxManager, { x, y }) => {
        if (x !== undefined && y !== undefined) vfx.showSocoSerioHit(vfxManager, x, y);
    },
    'VIGOR_DE_BATALHA': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showVigorDeBatalha(vfxManager, target, duration);
    },
    'FRENZY_GLOW': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showFrenzyGlow(vfxManager, target, duration);
    },
    'FRENZY_BUFF': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showFrenzyBuff(vfxManager, target, duration);
    },
    'TORNADO_MORTAL': (vfxManager, { target, radius, duration }) => {
        if (target && radius && duration) vfx.showTornadoMortal(vfxManager, target, radius, duration);
    },
    'CONE_SLASH': (vfxManager, { target, range, coneAngle, color }) => {
        if (target && range && coneAngle && color) vfx.showConeSlash(vfxManager, target, range, coneAngle, color);
    },
    'REGENERACAO_DE_BATALHA': (vfxManager, { target, isMaxFury }) => {
        if (target) vfx.showRegeneracaoDeBatalha(vfxManager, target, isMaxFury || false);
    },
    'INTERCEPTAR_TRAIL': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showInterceptarTrail(vfxManager, target, duration);
    },
    'EXPLOSAO_MAGICA_READY': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showExplosaoMagicaReady(vfxManager, target, duration);
    },
    'INTELECTO_SURREAL': (vfxManager, { targets }) => {
        if (targets) vfx.showIntelectoSurreal(vfxManager, targets);
    },
    'EXPLOSAO_GELIDA': (vfxManager, { x, y, radius }) => {
        if (x !== undefined && y !== undefined && radius) vfx.showExplosaoGelida(vfxManager, x, y, radius);
    },
    'MODO_OCULTO_SMOKE': (vfxManager, { target }) => {
        if (target) vfx.showModoOcultoSmoke(vfxManager, target);
    },
    'APUNHALAR_TELEPORT': (vfxManager, { fromX, fromY, toX, toY }) => {
        if (fromX !== undefined && fromY !== undefined && toX !== undefined && toY !== undefined) vfx.showApunhalarTeleport(vfxManager, fromX, fromY, toX, toY);
    },
    'AGILIDADE_EXTREMA': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showAgilidadeExtrema(vfxManager, target, duration);
    },
    'SHIELD_BASH_IMPACT': (vfxManager, { x, y }) => {
        if (x !== undefined && y !== undefined) vfx.showShieldBashImpact(vfxManager, x, y);
    },
    'TAUNT': (vfxManager, { target, radius }) => {
        if (target && radius) vfx.showTaunt(vfxManager, target, radius);
    },
    'PROTECAO_COMPARTILHADA': (vfxManager, { targets }) => {
        if (targets) vfx.showProtecaoCompartilhada(vfxManager, targets as HeroEntity[]);
    },
    'ESSENCIA_DA_VIDA': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showEssenciaDaVida(vfxManager, target, duration);
    },
    'ESSENCIA_DA_VIDA_CRIT_HEAL': (vfxManager, { target }) => {
        if (target) vfx.showEssenciaDaVidaCritHeal(vfxManager, target);
    },
    'BENCAO_FLORESTA': (vfxManager, { target, isSynergy, isCrit }) => {
        if (target) vfx.showBencaoFloresta(vfxManager, target, isSynergy || false, isCrit || false);
    },
    'PODER_SELVAGEM': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showPoderSelvagem(vfxManager, target, duration);
    },
    'STUN': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showStunEffect(vfxManager, target, duration);
    },
    'TIRO_MORTAL_HIT': (vfxManager, { target }) => {
        if (target) vfx.showTiroMortalHit(vfxManager, target);
    },
    'DISPARO_MULTIPLO': (vfxManager, { x, y, angle, coneAngle, numProjectiles, range }) => {
        if (x !== undefined && y !== undefined && angle !== undefined && coneAngle !== undefined && numProjectiles !== undefined && range !== undefined) {
            vfx.showDisparoMultiplo(vfxManager, x, y, angle, coneAngle, numProjectiles, range);
        }
    },
    'HABILIDADE_E_PRECISAO': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showHabilidadeEPrecisao(vfxManager, target, duration);
    },
    'QUEBRA_LUZ': (vfxManager, { target }) => {
        if (target) vfx.showQuebraLuz(vfxManager, target);
    },
    'ABSOLVICAO_CRUEL': (vfxManager, { targets, isCrit }) => {
        if (targets) vfx.showAbsolvicaoCruel(vfxManager, targets, isCrit || false);
    },
    'BENCAO_CORROMPIDA': (vfxManager, { targets }) => {
        if (targets) vfx.showBencaoCorrompida(vfxManager, targets);
    },
    'JULGAMENTO_DISTORCIDO': (vfxManager, { target }) => {
        if (target) vfx.showJulgamentoDistorcido(vfxManager, target);
    },
    'ESCUDO_DE_OSSOS_EXPLOSION': (vfxManager, { x, y, radius }) => {
        if (x !== undefined && y !== undefined && radius) vfx.showEscudoDeOssosExplosion(vfxManager, x, y, radius);
    },
    'ESCUDO_DE_OSSOS_BUFF': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showEscudoDeOssosBuff(vfxManager, target, duration);
    },
    'EXPLOSAO_NECROTICA': (vfxManager, { x, y, radius }) => {
        if (x !== undefined && y !== undefined && radius) vfx.showExplosaoNecrotica(vfxManager, x, y, radius);
    },
    'ESSENCE_DRAIN': (vfxManager, { fromX, fromY, toX, toY, duration }) => {
        if (fromX !== undefined && fromY !== undefined && toX !== undefined && toY !== undefined && duration) {
            vfx.showEssenceDrain(vfxManager, fromX, fromY, toX, toY, duration);
        }
    },
    'ABSORB_HEAL': (vfxManager, { target }) => {
        if (target) vfx.showAbsorbHeal(vfxManager, target);
    },
    'FREEZING_TOUCH': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showFreezingTouch(vfxManager, target, duration);
    },
    'GORILLA_STOMP': (vfxManager, { x, y, radius }) => {
        if (x !== undefined && y !== undefined && radius) vfx.showGorillaStomp(vfxManager, x, y, radius);
    },
    'POWER_UP': (vfxManager, { target, color }) => {
        if (target && color) vfx.showPowerUp(vfxManager, target, color);
    },
    'MACHO_ALFA_CHANNEL': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showMachoAlfa(vfxManager, target, duration);
    },
    'SCORPION_DIG': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showScorpionDig(vfxManager, target, duration);
    },
    'SCORPION_EMERGE': (vfxManager, { x, y, radius }) => {
        if (x !== undefined && y !== undefined && radius) vfx.showScorpionEmerge(vfxManager, x, y, radius);
    },
    'RED_BALLOON_EXPLOSION': (vfxManager, { x, y, radius }) => {
        if (x !== undefined && y !== undefined && radius) vfx.showRedBalloonExplosion(vfxManager, x, y, radius);
    },
    'INVOCAR_CICLONE_BUFF': (vfxManager, { target, duration }) => {
        if (target && duration) vfx.showInvocarCicloneBuff(vfxManager, target, duration);
    },
};