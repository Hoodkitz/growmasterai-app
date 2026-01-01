# RevenueCat SDK Integration für GrowMaster AI

## Vollständige Android (Kotlin) Implementierung

Diese Dokumentation beschreibt die vollständige Integration des RevenueCat SDK in die GrowMaster AI Android App mit Kotlin. Sie umfasst Installation, Konfiguration, Subscription-Management, Entitlement-Checking, Paywalls und Customer Center.

---

## Inhaltsverzeichnis

1. [Installation](#1-installation)
2. [SDK Konfiguration](#2-sdk-konfiguration)
3. [Produkt-Konfiguration](#3-produkt-konfiguration)
4. [Subscription-Funktionalität](#4-subscription-funktionalität)
5. [Entitlement Checking](#5-entitlement-checking)
6. [Customer Info Management](#6-customer-info-management)
7. [RevenueCat Paywall](#7-revenuecat-paywall)
8. [Customer Center](#8-customer-center)
9. [Best Practices](#9-best-practices)
10. [Fehlerbehandlung](#10-fehlerbehandlung)

---

## 1. Installation

### 1.1 Gradle Dependency hinzufügen

Füge die RevenueCat SDK Dependency zu deiner `build.gradle.kts` (Module: app) hinzu:

```kotlin
// build.gradle.kts (Module: app)
dependencies {
    // RevenueCat Purchases SDK - Version 9.18.1 (wie angefordert)
    implementation("com.revenuecat.purchases:purchases:9.18.1")
    
    // RevenueCat UI für Paywalls und Customer Center
    implementation("com.revenuecat.purchases:purchases-ui:9.18.1")
    
    // Optional: Amazon Appstore Support
    // implementation("com.revenuecat.purchases:purchases-store-amazon:9.18.1")
}
```

### 1.2 Projekt-Level Gradle

Stelle sicher, dass Maven Central in deiner `settings.gradle.kts` konfiguriert ist:

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
```

### 1.3 AndroidManifest.xml Konfiguration

```xml
<!-- AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    
    <!-- Internet-Berechtigung (erforderlich) -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
        android:name=".GrowMasterApplication"
        ...>
        
        <!-- Wichtig: launchMode auf standard oder singleTop setzen -->
        <activity
            android:name=".MainActivity"
            android:launchMode="standard"
            android:exported="true">
            <!-- ... -->
        </activity>
        
        <!-- AndroidX Startup Provider (nicht entfernen!) -->
        <provider
            android:name="androidx.startup.InitializationProvider"
            android:authorities="${applicationId}.androidx-startup"
            android:exported="false"
            tools:node="merge">
        </provider>
        
    </application>
</manifest>
```

### 1.4 Imports

Nach der Installation kannst du die folgenden Klassen importieren:

```kotlin
import com.revenuecat.purchases.CustomerInfo
import com.revenuecat.purchases.Entitlement
import com.revenuecat.purchases.Offering
import com.revenuecat.purchases.Offerings
import com.revenuecat.purchases.Package
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration
import com.revenuecat.purchases.PurchasesError
import com.revenuecat.purchases.models.Period
import com.revenuecat.purchases.models.Price
import com.revenuecat.purchases.models.StoreProduct
import com.revenuecat.purchases.interfaces.UpdatedCustomerInfoListener
import com.revenuecat.purchases.interfaces.ReceiveCustomerInfoCallback
import com.revenuecat.purchases.interfaces.ReceiveOfferingsCallback
import com.revenuecat.purchases.interfaces.PurchaseCallback
```

---

## 2. SDK Konfiguration

### 2.1 Application-Klasse erstellen

Erstelle eine Application-Klasse für die SDK-Initialisierung:

```kotlin
// GrowMasterApplication.kt
package com.growmaster.ai

import android.app.Application
import android.util.Log
import com.revenuecat.purchases.LogLevel
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration

class GrowMasterApplication : Application() {
    
    companion object {
        // Dein RevenueCat API Key
        private const val REVENUECAT_API_KEY = "test_tEDiRPvpJterHZOUuSHVMqocEXE"
        
        // Entitlement ID für Pro-Features
        const val ENTITLEMENT_PRO = "GrowMaster AI Pro"
        
        // Product IDs
        const val PRODUCT_MONTHLY = "monthly"
        const val PRODUCT_YEARLY = "yearly"
        const val PRODUCT_LIFETIME = "lifetime"
    }
    
    override fun onCreate() {
        super.onCreate()
        
        // Debug-Logs aktivieren (nur für Entwicklung!)
        Purchases.logLevel = LogLevel.DEBUG
        
        // RevenueCat SDK konfigurieren
        val configuration = PurchasesConfiguration.Builder(this, REVENUECAT_API_KEY)
            .appUserID(null) // null = Anonymous User, RevenueCat generiert ID
            .observerMode(false) // false = RevenueCat verwaltet Transaktionen
            .diagnosticsEnabled(true) // Diagnostics für Debugging
            .build()
        
        Purchases.configure(configuration)
        
        Log.d("GrowMaster", "RevenueCat SDK initialized successfully")
    }
}
```

### 2.2 Mit bekanntem User-ID konfigurieren

Wenn du bereits eine User-ID hast (z.B. nach Login):

```kotlin
// Bei bekannter User-ID (z.B. nach Login)
fun configureWithUserId(userId: String) {
    val configuration = PurchasesConfiguration.Builder(context, REVENUECAT_API_KEY)
        .appUserID(userId)
        .build()
    
    Purchases.configure(configuration)
}

// User identifizieren nach Login
fun loginUser(userId: String) {
    Purchases.sharedInstance.logIn(userId) { customerInfo, created, error ->
        if (error != null) {
            Log.e("GrowMaster", "Login error: ${error.message}")
            return@logIn
        }
        
        Log.d("GrowMaster", "User logged in: $userId, new user: $created")
        // CustomerInfo enthält jetzt die Subscription-Daten
        checkEntitlements(customerInfo)
    }
}

// User ausloggen
fun logoutUser() {
    Purchases.sharedInstance.logOut { customerInfo, error ->
        if (error != null) {
            Log.e("GrowMaster", "Logout error: ${error.message}")
            return@logOut
        }
        
        Log.d("GrowMaster", "User logged out, now anonymous")
    }
}
```

### 2.3 Proxy für China (Optional)

Falls deine App Nutzer in China hat:

```kotlin
// Vor Purchases.configure() aufrufen!
Purchases.proxyURL = URL("https://api.rc-backup.com/")
```

---

## 3. Produkt-Konfiguration

### 3.1 Offerings abrufen

Offerings sind Gruppen von Produkten, die du im RevenueCat Dashboard konfigurierst:

```kotlin
// SubscriptionManager.kt
class SubscriptionManager(private val context: Context) {
    
    private var currentOffering: Offering? = null
    
    /**
     * Lädt alle verfügbaren Offerings von RevenueCat
     */
    fun fetchOfferings(
        onSuccess: (Offerings) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.getOfferings(object : ReceiveOfferingsCallback {
            override fun onReceived(offerings: Offerings) {
                // Current Offering ist das Standard-Angebot
                currentOffering = offerings.current
                
                Log.d("GrowMaster", "Offerings loaded: ${offerings.all.size}")
                
                // Alle verfügbaren Packages loggen
                offerings.current?.availablePackages?.forEach { pkg ->
                    Log.d("GrowMaster", """
                        Package: ${pkg.identifier}
                        Product: ${pkg.product.title}
                        Price: ${pkg.product.price.formatted}
                        Period: ${pkg.product.period?.unit}
                    """.trimIndent())
                }
                
                onSuccess(offerings)
            }
            
            override fun onError(error: PurchasesError) {
                Log.e("GrowMaster", "Error fetching offerings: ${error.message}")
                onError(error)
            }
        })
    }
    
    /**
     * Gibt die Packages für die Produkte zurück
     */
    fun getPackages(): List<Package>? {
        return currentOffering?.availablePackages
    }
    
    /**
     * Findet ein spezifisches Package nach Identifier
     */
    fun getPackage(identifier: String): Package? {
        return currentOffering?.getPackage(identifier)
    }
    
    /**
     * Gibt das Monthly Package zurück
     */
    fun getMonthlyPackage(): Package? {
        return currentOffering?.monthly
    }
    
    /**
     * Gibt das Yearly Package zurück
     */
    fun getYearlyPackage(): Package? {
        return currentOffering?.annual
    }
    
    /**
     * Gibt das Lifetime Package zurück
     */
    fun getLifetimePackage(): Package? {
        return currentOffering?.lifetime
    }
}
```

### 3.2 Produkt-Datenklasse

```kotlin
// SubscriptionProduct.kt
data class SubscriptionProduct(
    val identifier: String,
    val title: String,
    val description: String,
    val price: String,
    val pricePerMonth: String?,
    val period: String,
    val package: Package
) {
    companion object {
        fun fromPackage(pkg: Package): SubscriptionProduct {
            val product = pkg.product
            
            val period = when (pkg.packageType) {
                PackageType.MONTHLY -> "Monatlich"
                PackageType.ANNUAL -> "Jährlich"
                PackageType.LIFETIME -> "Einmalig"
                else -> product.period?.let { formatPeriod(it) } ?: "Unbekannt"
            }
            
            val pricePerMonth = if (pkg.packageType == PackageType.ANNUAL) {
                val monthlyPrice = product.price.amountMicros / 12.0 / 1_000_000.0
                String.format("%.2f €/Monat", monthlyPrice)
            } else null
            
            return SubscriptionProduct(
                identifier = pkg.identifier,
                title = product.title,
                description = product.description,
                price = product.price.formatted,
                pricePerMonth = pricePerMonth,
                period = period,
                package = pkg
            )
        }
        
        private fun formatPeriod(period: Period): String {
            return when (period.unit) {
                Period.Unit.DAY -> "${period.value} Tag(e)"
                Period.Unit.WEEK -> "${period.value} Woche(n)"
                Period.Unit.MONTH -> "${period.value} Monat(e)"
                Period.Unit.YEAR -> "${period.value} Jahr(e)"
                else -> "Unbekannt"
            }
        }
    }
}
```

---

## 4. Subscription-Funktionalität

### 4.1 Kauf durchführen

```kotlin
// PurchaseManager.kt
class PurchaseManager(private val activity: Activity) {
    
    /**
     * Führt einen Kauf für das angegebene Package durch
     */
    fun purchasePackage(
        package: Package,
        onSuccess: (CustomerInfo) -> Unit,
        onError: (PurchasesError, Boolean) -> Unit,
        onCancelled: () -> Unit
    ) {
        Purchases.sharedInstance.purchase(
            PurchaseParams.Builder(activity, package).build(),
            object : PurchaseCallback {
                override fun onCompleted(
                    storeTransaction: StoreTransaction,
                    customerInfo: CustomerInfo
                ) {
                    Log.d("GrowMaster", "Purchase successful!")
                    
                    // Prüfe ob Pro-Entitlement jetzt aktiv ist
                    val isPro = customerInfo.entitlements[GrowMasterApplication.ENTITLEMENT_PRO]?.isActive == true
                    Log.d("GrowMaster", "Pro entitlement active: $isPro")
                    
                    onSuccess(customerInfo)
                }
                
                override fun onError(error: PurchasesError, userCancelled: Boolean) {
                    if (userCancelled) {
                        Log.d("GrowMaster", "User cancelled purchase")
                        onCancelled()
                    } else {
                        Log.e("GrowMaster", "Purchase error: ${error.message}")
                        onError(error, userCancelled)
                    }
                }
            }
        )
    }
    
    /**
     * Kauft ein spezifisches Produkt nach ID
     */
    fun purchaseProduct(
        productId: String,
        onSuccess: (CustomerInfo) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.getOfferings(object : ReceiveOfferingsCallback {
            override fun onReceived(offerings: Offerings) {
                val package = offerings.current?.availablePackages?.find { 
                    it.product.id == productId 
                }
                
                if (package != null) {
                    purchasePackage(
                        package = package,
                        onSuccess = onSuccess,
                        onError = { error, _ -> onError(error) },
                        onCancelled = { /* Handle cancellation */ }
                    )
                } else {
                    Log.e("GrowMaster", "Product not found: $productId")
                }
            }
            
            override fun onError(error: PurchasesError) {
                onError(error)
            }
        })
    }
    
    /**
     * Stellt frühere Käufe wieder her
     */
    fun restorePurchases(
        onSuccess: (CustomerInfo) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.restorePurchases(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                Log.d("GrowMaster", "Purchases restored successfully")
                onSuccess(customerInfo)
            }
            
            override fun onError(error: PurchasesError) {
                Log.e("GrowMaster", "Restore error: ${error.message}")
                onError(error)
            }
        })
    }
}
```

### 4.2 Subscription-Status prüfen

```kotlin
// SubscriptionStatus.kt
sealed class SubscriptionStatus {
    object Free : SubscriptionStatus()
    data class Premium(val expirationDate: Date?) : SubscriptionStatus()
    data class Pro(val expirationDate: Date?, val isLifetime: Boolean) : SubscriptionStatus()
}

class SubscriptionStatusManager {
    
    /**
     * Ermittelt den aktuellen Subscription-Status
     */
    fun getSubscriptionStatus(
        onResult: (SubscriptionStatus) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                val status = determineStatus(customerInfo)
                onResult(status)
            }
            
            override fun onError(error: PurchasesError) {
                onError(error)
            }
        })
    }
    
    private fun determineStatus(customerInfo: CustomerInfo): SubscriptionStatus {
        val proEntitlement = customerInfo.entitlements[GrowMasterApplication.ENTITLEMENT_PRO]
        
        return when {
            proEntitlement?.isActive == true -> {
                val isLifetime = proEntitlement.productIdentifier == GrowMasterApplication.PRODUCT_LIFETIME
                SubscriptionStatus.Pro(
                    expirationDate = proEntitlement.expirationDate,
                    isLifetime = isLifetime
                )
            }
            else -> SubscriptionStatus.Free
        }
    }
}
```

---

## 5. Entitlement Checking

### 5.1 Entitlement-Prüfung für "GrowMaster AI Pro"

```kotlin
// EntitlementChecker.kt
class EntitlementChecker {
    
    companion object {
        const val ENTITLEMENT_PRO = "GrowMaster AI Pro"
    }
    
    /**
     * Prüft ob der User Pro-Zugang hat
     */
    fun checkProAccess(
        onResult: (Boolean) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                val hasProAccess = customerInfo.entitlements[ENTITLEMENT_PRO]?.isActive == true
                onResult(hasProAccess)
            }
            
            override fun onError(error: PurchasesError) {
                onError(error)
            }
        })
    }
    
    /**
     * Prüft ob der User irgendein aktives Entitlement hat
     */
    fun hasAnyActiveEntitlement(
        onResult: (Boolean) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                val hasActiveEntitlement = customerInfo.entitlements.active.isNotEmpty()
                onResult(hasActiveEntitlement)
            }
            
            override fun onError(error: PurchasesError) {
                onError(error)
            }
        })
    }
    
    /**
     * Gibt alle aktiven Entitlements zurück
     */
    fun getActiveEntitlements(
        onResult: (Map<String, EntitlementInfo>) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                onResult(customerInfo.entitlements.active)
            }
            
            override fun onError(error: PurchasesError) {
                onError(error)
            }
        })
    }
    
    /**
     * Synchrone Prüfung mit gecachten Daten (für UI)
     */
    fun checkProAccessCached(): Boolean {
        return try {
            val customerInfo = Purchases.sharedInstance.cachedCustomerInfo
            customerInfo?.entitlements?.get(ENTITLEMENT_PRO)?.isActive == true
        } catch (e: Exception) {
            false
        }
    }
}
```

### 5.2 Feature-Gating implementieren

```kotlin
// FeatureGate.kt
object FeatureGate {
    
    private val entitlementChecker = EntitlementChecker()
    
    /**
     * Führt eine Aktion aus, wenn Pro-Zugang vorhanden ist
     * Andernfalls wird die Paywall angezeigt
     */
    fun withProAccess(
        activity: Activity,
        onGranted: () -> Unit,
        onDenied: () -> Unit = { showPaywall(activity) }
    ) {
        entitlementChecker.checkProAccess(
            onResult = { hasAccess ->
                if (hasAccess) {
                    onGranted()
                } else {
                    onDenied()
                }
            },
            onError = { error ->
                Log.e("FeatureGate", "Error checking access: ${error.message}")
                // Bei Fehler: Zugang verweigern und Paywall zeigen
                onDenied()
            }
        )
    }
    
    /**
     * Zeigt die Paywall an
     */
    private fun showPaywall(activity: Activity) {
        // Siehe Abschnitt 7 für Paywall-Implementierung
        PaywallManager.showPaywall(activity)
    }
    
    /**
     * Prüft Feature-Limits für Free-User
     */
    fun checkFeatureLimit(
        feature: String,
        currentUsage
: Int,
        limit: Int,
        onAllowed: () -> Unit,
        onLimitReached: () -> Unit
    ) {
        entitlementChecker.checkProAccess(
            onResult = { hasProAccess ->
                if (hasProAccess || currentUsage < limit) {
                    onAllowed()
                } else {
                    onLimitReached()
                }
            },
            onError = { _ ->
                // Bei Fehler: Limit prüfen
                if (currentUsage < limit) {
                    onAllowed()
                } else {
                    onLimitReached()
                }
            }
        )
    }
}
```

---

## 6. Customer Info Management

### 6.1 CustomerInfo abrufen und verarbeiten

```kotlin
// CustomerInfoManager.kt
class CustomerInfoManager {
    
    /**
     * Ruft die aktuelle CustomerInfo ab
     */
    fun getCustomerInfo(
        onSuccess: (CustomerInfo) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                logCustomerInfo(customerInfo)
                onSuccess(customerInfo)
            }
            
            override fun onError(error: PurchasesError) {
                Log.e("CustomerInfo", "Error: ${error.message}")
                onError(error)
            }
        })
    }
    
    /**
     * Loggt alle relevanten CustomerInfo-Daten
     */
    private fun logCustomerInfo(customerInfo: CustomerInfo) {
        Log.d("CustomerInfo", """
            ==========================================
            Customer ID: ${customerInfo.originalAppUserId}
            First Seen: ${customerInfo.firstSeen}
            Request Date: ${customerInfo.requestDate}
            
            Active Entitlements:
            ${customerInfo.entitlements.active.map { (id, info) ->
                "  - $id: expires ${info.expirationDate ?: "never"}"
            }.joinToString("\n")}
            
            All Purchases:
            ${customerInfo.allPurchasedProductIds.joinToString(", ")}
            
            Active Subscriptions:
            ${customerInfo.activeSubscriptions.joinToString(", ")}
            
            Non-Subscription Transactions:
            ${customerInfo.nonSubscriptionTransactions.size} transactions
            ==========================================
        """.trimIndent())
    }
    
    /**
     * Gibt Subscription-Details zurück
     */
    fun getSubscriptionDetails(customerInfo: CustomerInfo): SubscriptionDetails? {
        val proEntitlement = customerInfo.entitlements[GrowMasterApplication.ENTITLEMENT_PRO]
            ?: return null
        
        return SubscriptionDetails(
            isActive = proEntitlement.isActive,
            willRenew = proEntitlement.willRenew,
            productIdentifier = proEntitlement.productIdentifier,
            expirationDate = proEntitlement.expirationDate,
            purchaseDate = proEntitlement.latestPurchaseDate,
            isSandbox = proEntitlement.isSandbox,
            store = proEntitlement.store.name,
            periodType = proEntitlement.periodType.name
        )
    }
}

data class SubscriptionDetails(
    val isActive: Boolean,
    val willRenew: Boolean,
    val productIdentifier: String,
    val expirationDate: Date?,
    val purchaseDate: Date?,
    val isSandbox: Boolean,
    val store: String,
    val periodType: String
)
```

### 6.2 CustomerInfo Updates beobachten

```kotlin
// CustomerInfoObserver.kt
class CustomerInfoObserver : UpdatedCustomerInfoListener {
    
    private val listeners = mutableListOf<(CustomerInfo) -> Unit>()
    
    init {
        // Listener beim SDK registrieren
        Purchases.sharedInstance.updatedCustomerInfoListener = this
    }
    
    override fun onReceived(customerInfo: CustomerInfo) {
        Log.d("CustomerInfo", "CustomerInfo updated!")
        
        // Alle registrierten Listener benachrichtigen
        listeners.forEach { listener ->
            listener(customerInfo)
        }
    }
    
    /**
     * Registriert einen Listener für CustomerInfo-Updates
     */
    fun addListener(listener: (CustomerInfo) -> Unit) {
        listeners.add(listener)
    }
    
    /**
     * Entfernt einen Listener
     */
    fun removeListener(listener: (CustomerInfo) -> Unit) {
        listeners.remove(listener)
    }
    
    /**
     * Entfernt alle Listener
     */
    fun clearListeners() {
        listeners.clear()
    }
}
```

### 6.3 Customer Attributes setzen

```kotlin
// CustomerAttributesManager.kt
class CustomerAttributesManager {
    
    /**
     * Setzt benutzerdefinierte Attribute
     */
    fun setCustomerAttributes(attributes: Map<String, String>) {
        attributes.forEach { (key, value) ->
            Purchases.sharedInstance.setAttributes(mapOf(key to value))
        }
    }
    
    /**
     * Setzt die E-Mail-Adresse
     */
    fun setEmail(email: String) {
        Purchases.sharedInstance.setEmail(email)
    }
    
    /**
     * Setzt den Anzeigenamen
     */
    fun setDisplayName(name: String) {
        Purchases.sharedInstance.setDisplayName(name)
    }
    
    /**
     * Setzt die Push-Token für Benachrichtigungen
     */
    fun setPushToken(token: String) {
        Purchases.sharedInstance.setPushToken(token)
    }
    
    /**
     * Setzt GrowMaster-spezifische Attribute
     */
    fun setGrowMasterAttributes(
        growExperience: String,
        preferredStrains: List<String>,
        growMethod: String
    ) {
        Purchases.sharedInstance.setAttributes(mapOf(
            "grow_experience" to growExperience,
            "preferred_strains" to preferredStrains.joinToString(","),
            "grow_method" to growMethod,
            "app_version" to BuildConfig.VERSION_NAME
        ))
    }
}
```

---

## 7. RevenueCat Paywall

### 7.1 Paywall mit RevenueCat UI

RevenueCat bietet vorgefertigte Paywall-Templates, die du im Dashboard konfigurieren kannst:

```kotlin
// PaywallManager.kt
import com.revenuecat.purchases.ui.revenuecatui.PaywallDialog
import com.revenuecat.purchases.ui.revenuecatui.PaywallDialogOptions
import com.revenuecat.purchases.ui.revenuecatui.PaywallListener

object PaywallManager {
    
    /**
     * Zeigt die RevenueCat Paywall als Dialog an
     */
    fun showPaywall(
        activity: Activity,
        onPurchaseCompleted: ((CustomerInfo) -> Unit)? = null,
        onRestoreCompleted: ((CustomerInfo) -> Unit)? = null,
        onDismissed: (() -> Unit)? = null
    ) {
        val paywallListener = object : PaywallListener {
            override fun onPurchaseCompleted(customerInfo: CustomerInfo, storeTransaction: StoreTransaction) {
                Log.d("Paywall", "Purchase completed!")
                onPurchaseCompleted?.invoke(customerInfo)
            }
            
            override fun onRestoreCompleted(customerInfo: CustomerInfo) {
                Log.d("Paywall", "Restore completed!")
                onRestoreCompleted?.invoke(customerInfo)
            }
            
            override fun onPurchaseError(error: PurchasesError) {
                Log.e("Paywall", "Purchase error: ${error.message}")
            }
            
            override fun onRestoreError(error: PurchasesError) {
                Log.e("Paywall", "Restore error: ${error.message}")
            }
        }
        
        val options = PaywallDialogOptions.Builder()
            .setListener(paywallListener)
            .setDismissRequest { onDismissed?.invoke() }
            .build()
        
        PaywallDialog.show(activity, options)
    }
    
    /**
     * Zeigt die Paywall für ein spezifisches Offering
     */
    fun showPaywallForOffering(
        activity: Activity,
        offeringIdentifier: String,
        onPurchaseCompleted: ((CustomerInfo) -> Unit)? = null
    ) {
        Purchases.sharedInstance.getOfferings(object : ReceiveOfferingsCallback {
            override fun onReceived(offerings: Offerings) {
                val offering = offerings.getOffering(offeringIdentifier)
                
                if (offering != null) {
                    val options = PaywallDialogOptions.Builder()
                        .setOffering(offering)
                        .setListener(object : PaywallListener {
                            override fun onPurchaseCompleted(
                                customerInfo: CustomerInfo,
                                storeTransaction: StoreTransaction
                            ) {
                                onPurchaseCompleted?.invoke(customerInfo)
                            }
                        })
                        .build()
                    
                    PaywallDialog.show(activity, options)
                }
            }
            
            override fun onError(error: PurchasesError) {
                Log.e("Paywall", "Error loading offering: ${error.message}")
            }
        })
    }
}
```

### 7.2 Eigene Paywall UI (Jetpack Compose)

Falls du eine eigene Paywall erstellen möchtest:

```kotlin
// PaywallScreen.kt
@Composable
fun PaywallScreen(
    onPurchaseSuccess: () -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as Activity
    
    var offerings by remember { mutableStateOf<Offerings?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var isPurchasing by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    
    // Offerings laden
    LaunchedEffect(Unit) {
        Purchases.sharedInstance.getOfferings(object : ReceiveOfferingsCallback {
            override fun onReceived(off: Offerings) {
                offerings = off
                isLoading = false
            }
            
            override fun onError(err: PurchasesError) {
                error = err.message
                isLoading = false
            }
        })
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("GrowMaster Pro") },
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Schließen")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Text(
                text = "Werde Pro-Grower! 🌿",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Schalte alle Premium-Features frei",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Features Liste
            ProFeaturesList()
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Packages anzeigen
            when {
                isLoading -> CircularProgressIndicator()
                error != null -> Text("Fehler: $error", color = Color.Red)
                offerings != null -> {
                    offerings?.current?.availablePackages?.forEach { pkg ->
                        PackageCard(
                            package = pkg,
                            isPurchasing = isPurchasing,
                            onPurchase = {
                                isPurchasing = true
                                purchasePackage(activity, pkg) { success ->
                                    isPurchasing = false
                                    if (success) onPurchaseSuccess()
                                }
                            }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Restore Button
            TextButton(onClick = {
                Purchases.sharedInstance.restorePurchases(object : ReceiveCustomerInfoCallback {
                    override fun onReceived(customerInfo: CustomerInfo) {
                        if (customerInfo.entitlements[GrowMasterApplication.ENTITLEMENT_PRO]?.isActive == true) {
                            onPurchaseSuccess()
                        }
                    }
                    override fun onError(error: PurchasesError) {
                        // Handle error
                    }
                })
            }) {
                Text("Käufe wiederherstellen")
            }
        }
    }
}

@Composable
fun PackageCard(
    package: Package,
    isPurchasing: Boolean,
    onPurchase: () -> Unit
) {
    val product = package.product
    val isPopular = package.packageType == PackageType.ANNUAL
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        border = if (isPopular) BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            if (isPopular) {
                Text(
                    text = "BELIEBTESTE WAHL",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(4.dp))
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = product.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = product.description,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = product.price.formatted,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    if (package.packageType == PackageType.ANNUAL) {
                        val monthlyPrice = product.price.amountMicros / 12.0 / 1_000_000.0
                        Text(
                            text = String.format("%.2f €/Monat", monthlyPrice),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Button(
                onClick = onPurchase,
                modifier = Modifier.fillMaxWidth(),
                enabled = !isPurchasing
            ) {
                if (isPurchasing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Jetzt kaufen")
                }
            }
        }
    }
}

@Composable
fun ProFeaturesList() {
    val features = listOf(
        "🔬 Unbegrenzte KI-Diagnosen",
        "💬 Unbegrenzte Coach-Nachrichten",
        "🌱 Unbegrenzte Pflanzen",
        "📊 Erweiterte Analysen",
        "📅 Grow-Kalender mit Mondphasen",
        "🎯 Personalisierte Tipps",
        "📱 Offline-Zugang",
        "🚫 Keine Werbung"
    )
    
    Column {
        features.forEach { feature ->
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(feature)
            }
        }
    }
}

private fun purchasePackage(
    activity: Activity,
    package: Package,
    onComplete: (Boolean) -> Unit
) {
    Purchases.sharedInstance.purchase(
        PurchaseParams.Builder(activity, package).build(),
        object : PurchaseCallback {
            override fun onCompleted(
                storeTransaction: StoreTransaction,
                customerInfo: CustomerInfo
            ) {
                onComplete(true)
            }
            
            override fun onError(error: PurchasesError, userCancelled: Boolean) {
                onComplete(false)
            }
        }
    )
}
```

---

## 8. Customer Center

Das Customer Center ermöglicht es Nutzern, ihre Subscriptions selbst zu verwalten:

### 8.1 Customer Center anzeigen

```kotlin
// CustomerCenterManager.kt
import com.revenuecat.purchases.ui.revenuecatui.CustomerCenterDialog
import com.revenuecat.purchases.ui.revenuecatui.CustomerCenterDialogOptions
import com.revenuecat.purchases.ui.revenuecatui.CustomerCenterListener

object CustomerCenterManager {
    
    /**
     * Zeigt das Customer Center an
     */
    fun showCustomerCenter(
        activity: Activity,
        onDismiss: (() -> Unit)? = null
    ) {
        val listener = object : CustomerCenterListener {
            override fun onRestoreCompleted(customerInfo: CustomerInfo) {
                Log.d("CustomerCenter", "Restore completed")
            }
            
            override fun onRestoreError(error: PurchasesError) {
                Log.e("CustomerCenter", "Restore error: ${error.message}")
            }
            
            override fun onManageSubscriptionClick(productId: String) {
                Log.d("CustomerCenter", "Manage subscription clicked: $productId")
            }
            
            override fun onRefundRequestStarted(productId: String) {
                Log.d("CustomerCenter", "Refund request started: $productId")
            }
            
            override fun onRefundRequestCompleted(
                productId: String,
                refundRequestStatus: RefundRequestStatus
            ) {
                Log.d("CustomerCenter", "Refund request completed: $refundRequestStatus")
            }
            
            override fun onFeedbackSurveyCompleted(feedbackSurveyResult: FeedbackSurveyResult) {
                Log.d("CustomerCenter", "Feedback survey completed")
            }
        }
        
        val options = CustomerCenterDialogOptions.Builder()
            .setListener(listener)
            .setDismissRequest { onDismiss?.invoke() }
            .build()
        
        CustomerCenterDialog.show(activity, options)
    }
    
    /**
     * Prüft ob Customer Center angezeigt werden sollte
     * (nur für Nutzer mit aktiver Subscription)
     */
    fun shouldShowCustomerCenter(
        onResult: (Boolean) -> Unit
    ) {
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                val hasActiveSubscription = customerInfo.activeSubscriptions.isNotEmpty()
                onResult(hasActiveSubscription)
            }
            
            override fun onError(error: PurchasesError) {
                onResult(false)
            }
        })
    }
}
```

### 8.2 Customer Center in Settings integrieren

```kotlin
// SettingsScreen.kt (Ausschnitt)
@Composable
fun SubscriptionSettingsSection(activity: Activity) {
    var hasSubscription by remember { mutableStateOf(false) }
    var subscriptionDetails by remember { mutableStateOf<SubscriptionDetails?>(null) }
    
    LaunchedEffect(Unit) {
        CustomerInfoManager().getCustomerInfo(
            onSuccess = { customerInfo ->
                hasSubscription = customerInfo.activeSubscriptions.isNotEmpty()
                subscriptionDetails = CustomerInfoManager().getSubscriptionDetails(customerInfo)
            },
            onError = { /* Handle error */ }
        )
    }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Subscription",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            if (hasSubscription && subscriptionDetails != null) {
                // Aktive Subscription anzeigen
                Text("Status: Aktiv ✓")
                Text("Plan: ${subscriptionDetails?.productIdentifier}")
                subscriptionDetails?.expirationDate?.let {
                    Text("Läuft ab: ${SimpleDateFormat("dd.MM.yyyy").format(it)}")
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Customer Center Button
                OutlinedButton(
                    onClick = { CustomerCenterManager.showCustomerCenter(activity) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Subscription verwalten")
                }
            } else {
                // Keine Subscription
                Text("Du nutzt die kostenlose Version")
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Button(
                    onClick = { PaywallManager.showPaywall(activity) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Upgrade auf Pro")
                }
            }
        }
    }
}
```

---

## 9. Best Practices

### 9.1 Allgemeine Best Practices

| Bereich | Best Practice |
|---------|---------------|
| **Initialisierung** | SDK so früh wie möglich initialisieren (Application.onCreate) |
| **API Key** | Niemals den Secret API Key im Client verwenden, nur den Public Key |
| **Caching** | `getCustomerInfo()` ist gecacht, kann häufig aufgerufen werden |
| **Error Handling** | Immer Fehler abfangen und dem Nutzer anzeigen |
| **Testing** | Sandbox-Modus für Tests verwenden |
| **Logging** | Debug-Logs nur in Entwicklung aktivieren |
| **User IDs** | Konsistente User IDs über alle Plattformen verwenden |

### 9.2 Performance-Optimierung

```kotlin
// Singleton für häufig verwendete Manager
object RevenueCatManager {
    
    private var cachedCustomerInfo: CustomerInfo? = null
    private var lastFetch: Long = 0
    private const val CACHE_DURATION = 5 * 60 * 1000 // 5 Minuten
    
    /**
     * Gibt gecachte CustomerInfo zurück oder holt neue
     */
    fun getCustomerInfo(
        forceRefresh: Boolean = false,
        onSuccess: (CustomerInfo) -> Unit,
        onError: (PurchasesError) -> Unit
    ) {
        val now = System.currentTimeMillis()
        
        // Cache verwenden wenn gültig
        if (!forceRefresh && cachedCustomerInfo != null && now - lastFetch < CACHE_DURATION) {
            onSuccess(cachedCustomerInfo!!)
            return
        }
        
        // Neue Daten holen
        Purchases.sharedInstance.getCustomerInfo(object : ReceiveCustomerInfoCallback {
            override fun onReceived(customerInfo: CustomerInfo) {
                cachedCustomerInfo = customerInfo
                lastFetch = now
                onSuccess(customerInfo)
            }
            
            override fun onError(error: PurchasesError) {
                // Bei Fehler: Cache zurückgeben falls vorhanden
                cachedCustomerInfo?.let { onSuccess(it) } ?: onError(error)
            }
        })
    }
    
    /**
     * Schnelle Prüfung ohne Netzwerk
     */
    fun hasProAccessCached(): Boolean {
        return cachedCustomerInfo?.entitlements?.get(GrowMasterApplication.ENTITLEMENT_PRO)?.isActive == true
    }
    
    /**
     * Cache invalidieren (z.B. nach Kauf)
     */
    fun invalidateCache() {
        cachedCustomerInfo = null
        lastFetch = 0
    }
}
```

### 9.3 ProGuard/R8 Konfiguration

Falls du ProGuard oder R8 verwendest, füge diese Regeln hinzu:

```proguard
# proguard-rules.pro

# RevenueCat
-keep class com.revenuecat.purchases.** { *; }
-keep class com.android.vending.billing.** { *; }

# Kotlin Serialization (falls verwendet)
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
```

---

## 10. Fehlerbehandlung

### 10.1 Error Types

```kotlin
// ErrorHandler.kt
object PurchaseErrorHandler {
    
    fun handleError(error: PurchasesError): String {
        return when (error.code) {
            PurchasesErrorCode.PurchaseCancelledError -> 
                "Kauf abgebrochen"
            
            PurchasesErrorCode.StoreProblemError -> 
                "Problem mit dem Store. Bitte versuche es später erneut."
            
            PurchasesErrorCode.PurchaseNotAllowedError -> 
                "Käufe sind auf diesem Gerät nicht erlaubt."
            
            PurchasesErrorCode.PurchaseInvalidError -> 
                "Der Kauf ist ungültig."
            
            PurchasesErrorCode.ProductNotAvailableForPurchaseError -> 
                "Dieses Produkt ist derzeit nicht verfügbar."
            
            PurchasesErrorCode.ProductAlreadyPurchasedError -> 
                "Du hast dieses Produkt bereits gekauft."
            
            PurchasesErrorCode.ReceiptAlreadyInUseError -> 
                "Dieser Kauf ist bereits mit einem anderen Account verknüpft."
            
            PurchasesErrorCode.InvalidReceiptError -> 
                "Der Kaufbeleg ist ungültig."
            
            PurchasesErrorCode.MissingReceiptFileError -> 
                "Kaufbeleg nicht gefunden."
            
            PurchasesErrorCode.NetworkError -> 
                "Netzwerkfehler. Bitte prüfe deine Internetverbindung."
            
            PurchasesErrorCode.InvalidCredentialsError -> 
                "Ungültige Anmeldedaten."
            
            PurchasesErrorCode.UnexpectedBackendResponseError -> 
                "Unerwarteter Serverfehler. Bitte versuche es später erneut."
            
            PurchasesErrorCode.InvalidAppUserIdError -> 
                "Ungültige Benutzer-ID."
            
            PurchasesErrorCode.OperationAlreadyInProgressError -> 
                "Ein Vorgang läuft bereits. Bitte warte einen Moment."
            
            PurchasesErrorCode.UnknownBackendError -> 
                "Unbekannter Serverfehler."
            
            else -> 
                "Ein Fehler ist aufgetreten: ${error.message}"
        }
    }
    
    /**
     * Zeigt einen Fehler-Dialog an
     */
    fun showErrorDialog(
        context: Context,
        error: PurchasesError,
        onRetry: (() -> Unit)? = null
    ) {
        val message = handleError(error)
        
        AlertDialog.Builder(context)
            .setTitle("Fehler")
            .setMessage(message)
            .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
            .apply {
                if (onRetry != null && isRetryableError(error)) {
                    setNeutralButton("Erneut versuchen") { _, _ -> onRetry() }
                }
            }
            .show()
    }
    
    private fun isRetryableError(error: PurchasesError): Boolean {
        return error.code in listOf(
            PurchasesErrorCode.NetworkError,
            PurchasesErrorCode.StoreProblemError,
            PurchasesErrorCode.UnexpectedBackendResponseError
        )
    }
}
```

### 10.2 Logging für Debugging

```kotlin
// DebugLogger.kt
object RevenueCatDebugLogger {
    
    private const val TAG = "RevenueCat"
    
    fun enableDebugLogs() {
        Purchases.logLevel = LogLevel.DEBUG
    }
    
    fun disableDebugLogs() {
        Purchases.logLevel = LogLevel.ERROR
    }
    
    fun logPurchaseAttempt(packageId: String) {
        Log.d(TAG, "🛒 Purchase attempt: $packageId")
    }
    
    fun logPurchaseSuccess(customerInfo: CustomerInfo) {
        Log.d(TAG, "✅ Purchase successful!")
        Log.d(TAG, "   Active entitlements: ${customerInfo.entitlements.active.keys}")
    }
    
    fun logPurchaseError(error: PurchasesError) {
        Log.e(TAG, "❌ Purchase error: ${error.code} - ${error.message}")
        Log.e(TAG, "   Underlying error: ${error.underlyingErrorMessage}")
    }
    
    fun logEntitlementCheck(entitlementId: String, isActive: Boolean) {
        val emoji = if (isActive) "✅" else "❌"
        Log.d(TAG, "$emoji Entitlement '$entitlementId' active: $isActive")
    }
}
```

---

## Zusammenfassung

Diese Dokumentation bietet eine vollständige Implementierung des RevenueCat SDK für die GrowMaster AI Android App. Die wichtigsten Punkte sind:

1. **Installation** via Gradle mit Version 9.18.1
2. **Konfiguration** mit dem API Key `test_tEDiRPvpJterHZOUuSHVMqocEXE`
3. **Produkte**: Monthly, Yearly, Lifetime
4. **Entitlement**: "GrowMaster AI Pro"
5. **Paywall** und **Customer Center** für optimale UX
6. **Best Practices** für Performance und Fehlerbehandlung

---

## Referenzen

- [RevenueCat Android Installation](https://www.revenuecat.com/docs/getting-started/installation/android)
- [RevenueCat SDK Configuration](https://www.revenuecat.com/docs/getting-started/configuring-sdk)
- [RevenueCat Entitlements](https://www.revenuecat.com/docs/getting-started/entitlements)
- [RevenueCat Customer Info](https://www.revenuecat.com/docs/customers/customer-info)
- [RevenueCat Paywalls](https://www.revenuecat.com/docs/tools/paywalls)
- [RevenueCat Customer Center](https://www.revenuecat.com/docs/tools/customer-center)
