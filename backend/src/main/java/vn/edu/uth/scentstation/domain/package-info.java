/**
 * Business domain packages, one vertical slice per area.
 *
 * <p>The brand filter is declared here, once for the whole domain. Entities
 * that carry a {@code brand_id} column switch it on with
 * {@code @Filter(name = "brandFilter")}; {@code TenantFilterAspect} supplies
 * the parameter for each request. This is the persistence-layer approach
 * Report section 1.5.5 chose over adding a WHERE clause to every query, which
 * only has to be forgotten once to leak another brand's data (BR13, NFR2.2).
 */
@FilterDef(
        name = "brandFilter",
        parameters = @ParamDef(name = "brandId", type = Long.class)
)
package vn.edu.uth.scentstation.domain;

import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
