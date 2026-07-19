#!/usr/bin/env julia
# THESIS polyglot intelligence — pure Julia stdlib (no Pkg deps)
# julia ThesisIntel.jl <cmd> [json-ish or empty]

using Statistics
using Random

# ── minimal JSON helpers (stdlib only) ────────────────────────────

function json_escape(s::AbstractString)
    buf = IOBuffer()
    for c in s
        if c == '"'
            print(buf, "\\\"")
        elseif c == '\\'
            print(buf, "\\\\")
        elseif c == '\n'
            print(buf, "\\n")
        else
            print(buf, c)
        end
    end
    return String(take!(buf))
end

function json_val(v)
    if v === nothing
        return "null"
    elseif v isa Bool
        return v ? "true" : "false"
    elseif v isa Integer
        return string(v)
    elseif v isa AbstractFloat
        if isnan(v) || isinf(v)
            return "0"
        end
        return string(v)
    elseif v isa AbstractString
        return "\"" * json_escape(v) * "\""
    elseif v isa AbstractVector
        return "[" * join(map(json_val, v), ",") * "]"
    elseif v isa AbstractDict
        parts = String[]
        for (k, val) in v
            push!(parts, "\"" * json_escape(string(k)) * "\":" * json_val(val))
        end
        return "{" * join(parts, ",") * "}"
    else
        return "\"" * json_escape(string(v)) * "\""
    end
end

function out(obj::AbstractDict)
    println(json_val(obj))
end

"""Very small JSON object parser for flat/nested dicts of numbers/bools/strings/arrays of numbers."""
function parse_json_loose(s::AbstractString)
    s = strip(s)
    isempty(s) && return Dict{String,Any}()
    # Prefer nothing fancy: if looks like JSON object with estimated_gas etc use regex pulls
    d = Dict{String,Any}()
    for m in eachmatch(r"\"([a-zA-Z0-9_]+)\"\s*:\s*(-?\d+\.?\d*)", s)
        d[m.captures[1]] = parse(Float64, m.captures[2])
    end
    for m in eachmatch(r"\"([a-zA-Z0-9_]+)\"\s*:\s*(true|false)", s)
        d[m.captures[1]] = m.captures[2] == "true"
    end
    for m in eachmatch(r"\"([a-zA-Z0-9_]+)\"\s*:\s*\"([^\"]*)\"", s)
        d[m.captures[1]] = m.captures[2]
    end
    # series array
    sm = match(r"\"series\"\s*:\s*\[([^\]]*)\]", s)
    if sm !== nothing
        nums = Float64[]
        for p in split(sm.captures[1], ",")
            p = strip(p)
            isempty(p) && continue
            try
                push!(nums, parse(Float64, p))
            catch
            end
        end
        d["series"] = nums
    end
    return d
end

function seed_from(s::AbstractString)
    h = UInt64(0)
    for c in codeunits(s)
        h = (h * 0x100000001b3) ⊻ UInt64(c)
    end
    return Int(h % typemax(Int32))
end

function spectral_features(xs::Vector{Float64})
    n = length(xs)
    n == 0 && return Dict{String,Any}("n" => 0)
    μ = mean(xs)
    σ = std(xs; corrected = n > 1)
    mags = Float64[]
    K = min(n, 32)
    for k in 0:(K - 1)
        re = 0.0
        im = 0.0
        for t in 1:n
            ang = 2π * k * (t - 1) / n
            re += xs[t] * cos(ang)
            im -= xs[t] * sin(ang)
        end
        push!(mags, sqrt(re^2 + im^2) / n)
    end
    peak = argmax(mags)
    φ = (1 + sqrt(5)) / 2
    phi_idx = clamp(round(Int, n / φ), 1, length(mags))
    return Dict{String,Any}(
        "n" => n,
        "mean" => μ,
        "std" => σ,
        "min" => minimum(xs),
        "max" => maximum(xs),
        "peak_bin" => peak - 1,
        "peak_mag" => mags[peak],
        "phi_bin" => phi_idx - 1,
        "phi_mag" => mags[phi_idx],
        "energy" => sum(abs2, mags),
        "z_depth" => σ == 0 ? 0.0 : (xs[end] - μ) / σ,
    )
end

function monte_carlo_risk(params)
    equity = Float64(get(params, "equity", 10000.0))
    vol = Float64(get(params, "vol", 0.02))
    n = Int(get(params, "n", 2000))
    horizon = Int(get(params, "horizon", 1))
    alpha = Float64(get(params, "alpha", 0.95))
    Random.seed!(seed_from(string(get(params, "seed", "thesis"))))
    shocks = zeros(n)
    for i in 1:n
        r = 0.0
        for _ in 1:horizon
            r += vol * randn()
        end
        shocks[i] = equity * (exp(r) - 1)
    end
    sort!(shocks)
    idx = max(1, floor(Int, (1 - alpha) * n))
    return Dict{String,Any}(
        "ok" => true,
        "engine" => "julia.monte_carlo",
        "equity" => equity,
        "vol" => vol,
        "n" => n,
        "horizon" => horizon,
        "alpha" => alpha,
        "var" => -shocks[idx],
        "cvar" => -mean(shocks[1:idx]),
        "mean_pnl" => mean(shocks),
        "p05" => shocks[max(1, floor(Int, 0.05 * n))],
        "p50" => shocks[max(1, floor(Int, 0.5 * n))],
        "p95" => shocks[max(1, floor(Int, 0.95 * n))],
        "locality" => "julia",
    )
end

function portfolio_intel(params)
    # default balanced book
    w = Float64[0.4, 0.3, 0.3]
    s = Float64[0.02, 0.03, 0.025]
    ρ = Float64(get(params, "rho", 0.35))
    w = w ./ sum(w)
    n = length(w)
    port_var = 0.0
    for i in 1:n, j in 1:n
        cij = i == j ? s[i]^2 : ρ * s[i] * s[j]
        port_var += w[i] * w[j] * cij
    end
    hhi = sum(abs2, w)
    return Dict{String,Any}(
        "ok" => true,
        "engine" => "julia.portfolio",
        "weights" => w,
        "vols" => s,
        "rho" => ρ,
        "portfolio_vol" => sqrt(max(port_var, 0.0)),
        "hhi" => hhi,
        "diversification" => 1.0 / hhi,
        "locality" => "julia",
    )
end

function agent_score(params)
    # fixed demo agents if none parsed
    scored = [
        Dict{String,Any}("name" => "yield", "utility" => 0.08 / 0.03 * 0.9, "return" => 0.08, "risk" => 0.03, "lawful" => true, "gas_score" => 0.9),
        Dict{String,Any}("name" => "degen", "utility" => 0.4 / 0.25 * 0.05 * 0.2, "return" => 0.4, "risk" => 0.25, "lawful" => false, "gas_score" => 0.2),
        Dict{String,Any}("name" => "mm", "utility" => 0.05 / 0.015 * 0.95, "return" => 0.05, "risk" => 0.015, "lawful" => true, "gas_score" => 0.95),
    ]
    sort!(scored, by = x -> -x["utility"])
    return Dict{String,Any}(
        "ok" => true,
        "engine" => "julia.agent_score",
        "ranking" => scored,
        "winner" => scored[1]["name"],
        "locality" => "julia",
    )
end

function gas_optimize(params)
    est = Float64(get(params, "estimated_gas", 80000.0))
    margin_bps = Float64(get(params, "margin_bps", 10750.0))
    price_gwei = Float64(get(params, "price_gwei", 50.0))
    limit = est * margin_bps / 10000.0
    return Dict{String,Any}(
        "ok" => true,
        "engine" => "julia.gas",
        "estimated_gas" => est,
        "recommended_limit" => round(Int, limit),
        "margin_bps" => margin_bps,
        "overspend_flag" => limit > est * 10,
        "est_cost_mon" => limit * price_gwei * 1e-9,
        "native_transfer" => 21000,
        "doctrine" => "Monad charges gas_limit not gas used",
        "locality" => "julia",
    )
end

function spectral(params)
    xs = Float64[]
    if haskey(params, "series") && params["series"] isa AbstractVector
        for v in params["series"]
            try
                push!(xs, Float64(v))
            catch
            end
        end
    end
    if isempty(xs)
        Random.seed!(seed_from(string(get(params, "seed", "marks"))))
        x = 1.0
        for _ in 1:64
            x *= exp(0.002 * randn())
            push!(xs, x)
        end
    end
    feat = spectral_features(xs)
    tail = xs[max(1, end - 7):end]
    return Dict{String,Any}(
        "ok" => true,
        "engine" => "julia.spectral",
        "features" => feat,
        "series_tail" => tail,
        "locality" => "julia",
    )
end

function pulse(_params)
    return Dict{String,Any}(
        "ok" => true,
        "engine" => "julia.pulse",
        "julia_version" => string(VERSION),
        "threads" => Threads.nthreads(),
        "engines" => ["spectral", "monte_carlo", "portfolio", "agent_score", "gas_optimize", "pulse"],
        "locality" => "julia",
        "embedded_intelligence" => true,
        "deps" => "stdlib-only",
    )
end

function main()
    cmd = length(ARGS) >= 1 ? ARGS[1] : "pulse"
    raw = length(ARGS) >= 2 ? ARGS[2] : "{}"
    params = parse_json_loose(raw)
    try
        result = if cmd in ("pulse", "status", "health")
            pulse(params)
        elseif cmd in ("spectral", "spectrum", "fft")
            spectral(params)
        elseif cmd in ("monte_carlo", "mc", "var")
            monte_carlo_risk(params)
        elseif cmd in ("portfolio", "port")
            portfolio_intel(params)
        elseif cmd in ("agent_score", "agents", "rank")
            agent_score(params)
        elseif cmd in ("gas", "gas_optimize")
            gas_optimize(params)
        else
            Dict{String,Any}("ok" => false, "error" => "unknown cmd $cmd")
        end
        out(result)
    catch e
        out(Dict{String,Any}("ok" => false, "error" => sprint(showerror, e), "engine" => "julia", "cmd" => cmd))
    end
end

main()
